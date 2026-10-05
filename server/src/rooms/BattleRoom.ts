import { Room, Client } from 'colyseus';
import { BattleStateSchema, PlayerSchema } from '../schema/BattleState.js';
import { SimulationLoop } from '../simulation/SimulationLoop.js';
import { GAME_CONFIG, GameMode, Team, Vector3D } from '../shared/gameConfig.js';
import {
  InputMessageSchema,
  FireWeaponSchema,
  SetTeamSchema,
  JoinRoomOptionsSchema
} from '../security/schemas.js';
import { sanitizeCallsign, isValidRoomCode, generateSecureRoomCode } from '../security/sanitizer.js';
import { AuthService, AuthTokenPayload } from '../security/authService.js';
import { AntiCheatSystem } from '../security/antiCheat.js';
import { WebSocketRateLimiter, RoomBruteForceProtection } from '../security/rateLimiter.js';
import { SecurityLogger } from '../security/securityLogger.js';

interface JoinOptions {
  playerName?: string;
  playerColor?: 'yellow' | 'blue' | 'red' | 'green';
  mode?: GameMode;
  roomCode?: string;
  team?: Team;
  authToken?: string;
}

interface RoomAuthContext {
  userId: string;
  username: string;
  role: 'pilot' | 'admin' | 'guest';
  isGuest: boolean;
  ip: string;
}

export class BattleRoom extends Room {
  maxClients = 4;
  private simulationLoop!: SimulationLoop;

  async onCreate(options: JoinOptions) {
    this.setState(new BattleStateSchema());

    const mode: GameMode = options.mode || '1v1';
    (this.state as BattleStateSchema).gameMode = mode;
    this.maxClients = mode === '1v1' ? 2 : 4;

    // Cryptographically secure, sanitized 6-character room code
    const rawCode = options.roomCode;
    const roomCode = (rawCode && isValidRoomCode(rawCode))
      ? rawCode.trim().toUpperCase()
      : generateSecureRoomCode(6);

    (this.state as BattleStateSchema).roomCode = roomCode;
    (this.state as BattleStateSchema).roomStatus = 'LOBBY';
    this.setMetadata({ roomCode });

    // Initialize Simulation Loop & Rapier 3D World
    this.simulationLoop = new SimulationLoop();
    await this.simulationLoop.init();

    // Register Network Handlers
    this.registerMessages();

    // Start 30Hz Fixed Timestep Simulation
    const dt = 1 / GAME_CONFIG.SERVER_TICK_RATE;
    this.setSimulationInterval(() => {
      const state = this.state as BattleStateSchema;
      const updateResult = this.simulationLoop.update(state, dt);

      // Broadcast hit confirmation events to all players
      if (updateResult.hits.length > 0) {
        for (const hit of updateResult.hits) {
          this.broadcast('damage_applied', hit);
        }
      }

      if (updateResult.matchEnded) {
        // Record authoritative match outcomes for authenticated players
        state.players.forEach((p) => {
          const isWinner = p.id === state.winnerId || (state.winnerTeam && p.team === state.winnerTeam);
          AuthService.recordMatchStats(
            p.id,
            Boolean(isWinner),
            p.damageDealt,
            p.shotsFired,
            p.shotsHit
          );
        });

        this.broadcast('match_ended', {
          winnerId: state.winnerId,
          winnerName: state.winnerName,
          winnerTeam: state.winnerTeam,
          gameMode: state.gameMode
        });
      }
    }, 1000 / GAME_CONFIG.SERVER_TICK_RATE);

    console.log(`[BattleRoom] Secure Sector Created: ${roomCode} (Mode: ${mode})`);
  }

  /**
   * Colyseus Server-side Authentication & Rate-Limit Hook
   */
  async onAuth(client: Client, options: unknown, request: any): Promise<RoomAuthContext> {
    const ip = request?.headers['x-forwarded-for']?.toString() || request?.socket?.remoteAddress || 'unknown';

    // 1. Check Room-Code Brute Force Lockout
    if (RoomBruteForceProtection.isLocked(ip)) {
      SecurityLogger.logAccessDenied('Room join lockout in effect due to excessive failures', ip);
      throw new Error('Sector communications temporarily restricted. Please try again shortly.');
    }

    // 2. Validate Join Options Schema
    const parseResult = JoinRoomOptionsSchema.safeParse(options);
    if (!parseResult.success) {
      RoomBruteForceProtection.recordFailure(ip);
      SecurityLogger.logViolation(client.sessionId, 'unknown', 'INVALID_JOIN_OPTIONS', 1, {
        errors: parseResult.error.format()
      });
      throw new Error('Invalid sector connection payload format.');
    }

    const validated = parseResult.data;

    // 3. Verify Player Capacity
    const state = this.state as BattleStateSchema;
    if (state.players.size >= this.maxClients) {
      throw new Error('Sector reached maximum pilot capacity.');
    }

    // 4. Authenticate Token or Assign Verified Guest Identity
    let authPayload: AuthTokenPayload | null = null;
    if (validated.authToken) {
      authPayload = AuthService.verifyToken(validated.authToken);
    }

    if (authPayload) {
      return {
        userId: authPayload.userId,
        username: authPayload.username,
        role: authPayload.role,
        isGuest: authPayload.isGuest,
        ip
      };
    }

    // Fallback: Generate signed guest identity with sanitized callsign
    const guestCallsign = sanitizeCallsign(validated.playerName);
    const guestSession = AuthService.generateGuestSession(guestCallsign);
    return {
      userId: guestSession.userId,
      username: guestSession.username,
      role: 'guest',
      isGuest: true,
      ip
    };
  }

  onJoin(client: Client, options?: JoinOptions, auth?: RoomAuthContext) {
    const state = this.state as BattleStateSchema;
    const ip = auth?.ip || 'unknown';
    RoomBruteForceProtection.recordSuccess(ip);

    console.log(`[BattleRoom] Pilot ${auth?.username} (${client.sessionId}) joining room ${state.roomCode}`);

    const slot = state.players.size + 1;
    const isHost = state.players.size === 0;

    const player = new PlayerSchema();
    player.id = auth?.userId || client.sessionId;
    player.sessionId = client.sessionId;
    player.name = auth?.username || `Pilot-${slot}`;
    player.color = options?.playerColor || (slot === 1 ? 'yellow' : slot === 2 ? 'blue' : slot === 3 ? 'red' : 'green');
    player.slot = slot;
    player.isHost = isHost;
    player.ready = true;
    player.hp = GAME_CONFIG.MAX_HP;
    player.maxHp = GAME_CONFIG.MAX_HP;
    player.ammo = GAME_CONFIG.BULLET_MAGAZINE_SIZE;

    // Team Assignment for 2v2
    if (state.gameMode === '2v2') {
      player.team = options?.team || (slot <= 2 ? 'A' : 'B');
    } else {
      player.team = 'NONE';
    }

    // Set initial spawn coordinates according to slot
    const spawnPos = this.getSpawnPosition(slot, state.players.size);
    player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);

    state.players.set(client.sessionId, player);

    // Register with Anti-Cheat System
    AntiCheatSystem.registerPlayer(client.sessionId, spawnPos);

    // Notify room of player join
    this.broadcast('player_joined', {
      id: client.sessionId,
      name: player.name,
      color: player.color,
      team: player.team,
      slot: player.slot
    });
  }

  async onLeave(client: Client, code?: number) {
    const state = this.state as BattleStateSchema;
    const player = state.players.get(client.sessionId);
    if (!player) return;

    player.connected = false;

    // Clean up rate limit and anti-cheat tracking
    WebSocketRateLimiter.unregisterClient(client.sessionId);
    AntiCheatSystem.unregisterPlayer(client.sessionId);

    try {
      if (code === 1000) {
        throw new Error('Consented disconnect');
      }

      // 15-Second Reconnect Window
      console.log(`[BattleRoom] Player ${player.name} disconnected, allowing 15s reconnect...`);
      await this.allowReconnection(client, GAME_CONFIG.RECONNECT_TIMEOUT_MS / 1000);
      player.connected = true;
      AntiCheatSystem.registerPlayer(client.sessionId, {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z
      });
      console.log(`[BattleRoom] Player ${player.name} successfully reconnected!`);
    } catch {
      console.log(`[BattleRoom] Player ${player.name} permanently removed.`);
      state.players.delete(client.sessionId);

      // Reassign host if needed
      if (player.isHost) {
        const remaining = Array.from(state.players.values());
        if (remaining.length > 0) {
          remaining[0].isHost = true;
        }
      }

      this.broadcast('player_left', { id: client.sessionId, name: player.name });
    }
  }

  onDispose() {
    console.log(`[BattleRoom] Disposing room ${(this.state as BattleStateSchema).roomCode}`);
  }

  private registerMessages() {
    // 1. Authoritative Flight Movement Validation
    this.onMessage('input', (client, rawInput: unknown) => {
      if (!WebSocketRateLimiter.canProcessMessage(client.sessionId)) return;

      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.alive || state.roomStatus !== 'BATTLE') return;

      // Schema validation
      const parseResult = InputMessageSchema.safeParse(rawInput);
      if (!parseResult.success) {
        SecurityLogger.logViolation(client.sessionId, player.id, 'MALFORMED_INPUT_PACKET', 1);
        return;
      }

      const input = parseResult.data;
      if (input.position && input.rotation && input.velocity) {
        const check = AntiCheatSystem.validateMovement(
          client.sessionId,
          player,
          input.position,
          input.rotation,
          input.velocity
        );

        if (check.shouldDisconnect) {
          SecurityLogger.logViolation(client.sessionId, player.id, 'CRITICAL_SPEED_VIOLATION_EVICT', 10);
          client.leave(4001);
          return;
        }

        // Apply authoritative coordinates
        player.position.set(check.position.x, check.position.y, check.position.z);
        player.rotation.set(input.rotation[0], input.rotation[1], input.rotation[2]);
        player.velocity.set(input.velocity[0], input.velocity[1], input.velocity[2]);
      }
    });

    // 2. Primary Weapon: Bullet / Plasma Blaster (2 HP, 0.10s interval, 30 magazine)
    this.onMessage('fire_bullet', (client, rawData: unknown) => {
      if (!WebSocketRateLimiter.canProcessMessage(client.sessionId)) return;

      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.alive || state.roomStatus !== 'BATTLE') return;

      const parseResult = FireWeaponSchema.safeParse(rawData);
      if (!parseResult.success) return;

      const data = parseResult.data;
      const combatCheck = AntiCheatSystem.validateWeaponFiring(
        client.sessionId,
        player,
        'BULLET',
        data.origin,
        data.direction,
        data.attackId
      );

      if (!combatCheck.valid) return;

      const proj = this.simulationLoop.projectileSystem.spawnBullet(
        state,
        client.sessionId,
        data.origin,
        data.direction,
        data.attackId
      );

      if (proj) {
        this.broadcast('bullet_spawned', {
          id: proj.id,
          attackId: proj.attackId,
          ownerId: client.sessionId,
          position: [proj.position.x, proj.position.y, proj.position.z],
          direction: [proj.direction.x, proj.direction.y, proj.direction.z],
          color: proj.color,
          team: proj.team
        });
      }
    });

    // 3. Secondary Weapon: Laser Beam (12 HP, 3s recharge)
    this.onMessage('fire_laser', (client, rawData: unknown) => {
      if (!WebSocketRateLimiter.canProcessMessage(client.sessionId)) return;

      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.alive || state.roomStatus !== 'BATTLE') return;

      const parseResult = FireWeaponSchema.safeParse(rawData);
      if (!parseResult.success) return;

      const data = parseResult.data;
      const combatCheck = AntiCheatSystem.validateWeaponFiring(
        client.sessionId,
        player,
        'LASER',
        data.origin,
        data.direction,
        data.attackId
      );

      if (!combatCheck.valid) return;

      const laserRes = this.simulationLoop.laserSystem.fireLaser(
        state,
        client.sessionId,
        data.origin,
        data.direction,
        data.attackId
      );

      if (laserRes.valid) {
        this.broadcast('laser_fired', {
          attackId: laserRes.attackId,
          shooterId: client.sessionId,
          start: laserRes.start,
          end: laserRes.end,
          blocked: laserRes.blocked,
          hitTargetId: laserRes.hitTargetId,
          damage: laserRes.damage,
          remainingHp: laserRes.remainingHp,
          eliminated: laserRes.eliminated
        });

        if (laserRes.hitTargetId && laserRes.damage > 0) {
          this.broadcast('damage_applied', {
            attackId: laserRes.attackId,
            attackerId: client.sessionId,
            defenderId: laserRes.hitTargetId,
            damage: laserRes.damage,
            remainingHp: laserRes.remainingHp,
            weaponType: 'LASER'
          });
        }
      }
    });

    // 4. Special High-Yield Weapon: Solar Beam (30 HP, 10s recharge)
    this.onMessage('fire_solar', (client, rawData: unknown) => {
      if (!WebSocketRateLimiter.canProcessMessage(client.sessionId)) return;

      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.alive || state.roomStatus !== 'BATTLE') return;

      const parseResult = FireWeaponSchema.safeParse(rawData);
      if (!parseResult.success) return;

      const data = parseResult.data;
      const combatCheck = AntiCheatSystem.validateWeaponFiring(
        client.sessionId,
        player,
        'SOLAR',
        data.origin,
        data.direction,
        data.attackId
      );

      if (!combatCheck.valid) return;

      const solarRes = this.simulationLoop.solarBeamSystem.fireSolar(
        state,
        client.sessionId,
        data.origin,
        data.direction,
        data.attackId
      );

      if (solarRes.valid) {
        this.broadcast('solar_fired', {
          attackId: solarRes.attackId,
          shooterId: client.sessionId,
          start: solarRes.start,
          end: solarRes.end,
          blocked: solarRes.blocked,
          hitTargetId: solarRes.hitTargetId,
          damage: solarRes.damage,
          remainingHp: solarRes.remainingHp,
          eliminated: solarRes.eliminated
        });

        if (solarRes.hitTargetId && solarRes.damage > 0) {
          this.broadcast('damage_applied', {
            attackId: solarRes.attackId,
            attackerId: client.sessionId,
            defenderId: solarRes.hitTargetId,
            damage: solarRes.damage,
            remainingHp: solarRes.remainingHp,
            weaponType: 'SOLAR_BEAM'
          });
        }
      }
    });

    // 5. Launch Match (requires host or >= 2 players)
    this.onMessage('start_match', (client) => {
      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player) return;

      const minPlayers = 2;
      if (state.players.size >= minPlayers && (state.roomStatus === 'LOBBY' || state.roomStatus === 'WAITING')) {
        state.roomStatus = 'COUNTDOWN';
        state.countdown = GAME_CONFIG.COUNTDOWN_SECONDS;
        this.broadcast('match_countdown_started', { countdown: GAME_CONFIG.COUNTDOWN_SECONDS });
      }
    });

    // 6. Manual Reload Request
    this.onMessage('reload', (client) => {
      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.alive || player.isReloading) return;
      if (player.ammo < GAME_CONFIG.BULLET_MAGAZINE_SIZE) {
        player.isReloading = true;
        player.reloadTimeRemaining = GAME_CONFIG.BULLET_RELOAD_MS / 1000;
      }
    });

    // 7. Team Switch (for 2v2 lobby)
    this.onMessage('set_team', (client, rawData: unknown) => {
      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || state.roomStatus !== 'LOBBY') return;

      const parseResult = SetTeamSchema.safeParse(rawData);
      if (!parseResult.success) return;

      player.team = parseResult.data.team;
    });

    // 8. Rematch Request
    this.onMessage('request_rematch', () => {
      const state = this.state as BattleStateSchema;
      if (state.roomStatus === 'FINISHED') {
        state.roomStatus = 'LOBBY';
        state.winnerId = '';
        state.winnerName = '';
        state.winnerTeam = '';
        state.projectiles.clear();
        this.simulationLoop.damageSystem.reset();

        let s = 1;
        state.players.forEach((p: PlayerSchema) => {
          p.hp = GAME_CONFIG.MAX_HP;
          p.alive = true;
          p.ammo = GAME_CONFIG.BULLET_MAGAZINE_SIZE;
          p.isReloading = false;
          p.laserCooldownRemaining = 0;
          p.solarCooldownRemaining = 0;
          const spawn = this.getSpawnPosition(s, state.players.size);
          p.position.set(spawn.x, spawn.y, spawn.z);
          AntiCheatSystem.registerPlayer(p.sessionId, spawn);
          s++;
        });

        this.broadcast('rematch_accepted', {});
      }
    });
  }

  private getSpawnPosition(slot: number, total: number): Vector3D {
    switch (slot) {
      case 1: return { x: 0, y: 0, z: -80 };
      case 2: return { x: 0, y: 0, z: 80 };
      case 3: return { x: -80, y: 15, z: 0 };
      case 4: return { x: 80, y: -15, z: 0 };
      default: return { x: 0, y: 0, z: 0 };
    }
  }
}
