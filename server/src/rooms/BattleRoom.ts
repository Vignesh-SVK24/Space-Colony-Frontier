import { Room, Client } from 'colyseus';
import { BattleStateSchema, PlayerSchema } from '../schema/BattleState.js';
import { SimulationLoop } from '../simulation/SimulationLoop.js';
import { GAME_CONFIG, GameMode, Team, Vector3D } from '../shared/gameConfig.js';

interface JoinOptions {
  playerName?: string;
  playerColor?: string;
  mode?: GameMode;
  roomCode?: string;
  team?: Team;
}

export class BattleRoom extends Room {
  maxClients = 4;
  private simulationLoop!: SimulationLoop;

  async onCreate(options: JoinOptions) {
    this.setState(new BattleStateSchema());

    const mode: GameMode = options.mode || '1v1';
    (this.state as BattleStateSchema).gameMode = mode;
    this.maxClients = mode === '1v1' ? 2 : 4;

    // Clean 6-character room code
    (this.state as BattleStateSchema).roomCode = options.roomCode || this.generateRoomCode();
    (this.state as BattleStateSchema).roomStatus = 'LOBBY';

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
        this.broadcast('match_ended', {
          winnerId: state.winnerId,
          winnerName: state.winnerName,
          winnerTeam: state.winnerTeam,
          gameMode: state.gameMode
        });
      }
    }, 1000 / GAME_CONFIG.SERVER_TICK_RATE);

    console.log(`[BattleRoom] Created Room ${(this.state as BattleStateSchema).roomCode} (Mode: ${mode})`);
  }

  onJoin(client: Client, options?: JoinOptions) {
    const state = this.state as BattleStateSchema;
    console.log(`[BattleRoom] Client ${client.sessionId} joining room ${state.roomCode}`);

    const slot = state.players.size + 1;
    const isHost = state.players.size === 0;

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.sessionId = client.sessionId;
    player.name = options?.playerName || `Pilot-${slot}`;
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

    try {
      if (code === 1000) {
        throw new Error('Consented disconnect');
      }

      // 15-Second Reconnect Window
      console.log(`[BattleRoom] Player ${player.name} disconnected, allowing 15s reconnect...`);
      await this.allowReconnection(client, GAME_CONFIG.RECONNECT_TIMEOUT_MS / 1000);
      player.connected = true;
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
    // 1. Flight Input Transmission
    this.onMessage('input', (client, input: any) => {
      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.alive || state.roomStatus !== 'BATTLE') return;

      if (input.position && Array.isArray(input.position)) {
        player.position.set(input.position[0], input.position[1], input.position[2]);
      }
      if (input.rotation && Array.isArray(input.rotation)) {
        player.rotation.set(input.rotation[0], input.rotation[1], input.rotation[2]);
      }
      if (input.velocity && Array.isArray(input.velocity)) {
        player.velocity.set(input.velocity[0], input.velocity[1], input.velocity[2]);
      }
    });

    // 2. Primary Weapon: Bullet / Plasma Blaster (2 HP, 0.1s rate, 30 magazine)
    this.onMessage('fire_bullet', (client, data: { origin: Vector3D; direction: Vector3D; attackId?: string }) => {
      const state = this.state as BattleStateSchema;
      if (state.roomStatus !== 'BATTLE') return;
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
    this.onMessage('fire_laser', (client, data: { origin: Vector3D; direction: Vector3D; attackId?: string }) => {
      const state = this.state as BattleStateSchema;
      if (state.roomStatus !== 'BATTLE') return;
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
    this.onMessage('fire_solar', (client, data: { origin: Vector3D; direction: Vector3D; attackId?: string }) => {
      const state = this.state as BattleStateSchema;
      if (state.roomStatus !== 'BATTLE') return;
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

    // 5. Host Launch Match
    this.onMessage('start_match', (client) => {
      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || !player.isHost) return;

      const minPlayers = state.gameMode === '1v1' ? 2 : 2;
      if (state.players.size >= minPlayers) {
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
    this.onMessage('set_team', (client, data: { team: Team }) => {
      const state = this.state as BattleStateSchema;
      const player = state.players.get(client.sessionId);
      if (!player || state.roomStatus !== 'LOBBY') return;
      if (data.team === 'A' || data.team === 'B') {
        player.team = data.team;
      }
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
          s++;
        });

        this.broadcast('rematch_accepted', {});
      }
    });
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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
