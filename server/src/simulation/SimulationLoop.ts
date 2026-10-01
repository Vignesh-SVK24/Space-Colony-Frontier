import { BattleStateSchema } from '../schema/BattleState.js';
import { ServerPhysicsWorld } from './ServerPhysicsWorld.js';
import { DamageSystem } from './DamageSystem.js';
import { ProjectileSystem } from './ProjectileSystem.js';
import { LaserSystem } from './LaserSystem.js';
import { SolarBeamSystem } from './SolarBeamSystem.js';
import { BoundarySystem } from './BoundarySystem.js';
import { GAME_CONFIG } from '../shared/gameConfig.js';

export class SimulationLoop {
  public physicsWorld: ServerPhysicsWorld;
  public damageSystem: DamageSystem;
  public projectileSystem: ProjectileSystem;
  public laserSystem: LaserSystem;
  public solarBeamSystem: SolarBeamSystem;
  public boundarySystem: BoundarySystem;

  private isRunning = false;
  private intervalId: any = null;
  private lastTime = 0;

  constructor() {
    this.physicsWorld = new ServerPhysicsWorld();
    this.damageSystem = new DamageSystem();
    this.projectileSystem = new ProjectileSystem(this.physicsWorld, this.damageSystem);
    this.laserSystem = new LaserSystem(this.physicsWorld, this.damageSystem);
    this.solarBeamSystem = new SolarBeamSystem(this.physicsWorld, this.damageSystem);
    this.boundarySystem = new BoundarySystem();
  }

  async init() {
    await this.physicsWorld.init();
  }

  /**
   * Fixed 30Hz simulation step
   */
  update(state: BattleStateSchema, dt: number): { hits: any[]; blocked: any[]; matchEnded: boolean } {
    state.serverTick += 1;

    // 1. Advance match countdown if active
    if (state.roomStatus === 'COUNTDOWN') {
      state.countdown -= dt;
      if (state.countdown <= 0) {
        state.roomStatus = 'BATTLE';
        state.countdown = 0;
      }
      return { hits: [], blocked: [], matchEnded: false };
    }

    if (state.roomStatus !== 'BATTLE') {
      return { hits: [], blocked: [], matchEnded: false };
    }

    state.matchDuration += dt;

    // 2. Update player weapon timers (reload, laser, solar cooldowns)
    state.players.forEach((player) => {
      // Reload timer
      if (player.isReloading) {
        player.reloadTimeRemaining = Math.max(0, player.reloadTimeRemaining - dt);
        if (player.reloadTimeRemaining <= 0) {
          player.isReloading = false;
          player.ammo = GAME_CONFIG.BULLET_MAGAZINE_SIZE;
        }
      }

      // Laser recharge
      if (player.laserCooldownRemaining > 0) {
        player.laserCooldownRemaining = Math.max(0, player.laserCooldownRemaining - dt);
      }

      // Solar recharge
      if (player.solarCooldownRemaining > 0) {
        player.solarCooldownRemaining = Math.max(0, player.solarCooldownRemaining - dt);
      }
    });

    // 3. Update projectiles with continuous swept collision
    const projResult = this.projectileSystem.update(state, dt);

    // 4. Enforce spherical arena boundary
    this.boundarySystem.enforce(state, dt);

    // 5. Step Rapier physics world
    this.physicsWorld.step();

    // 6. Check match completion / win condition
    const matchEnded = this.checkWinCondition(state);

    return {
      hits: projResult.hits,
      blocked: projResult.blocked,
      matchEnded
    };
  }

  private checkWinCondition(state: BattleStateSchema): boolean {
    if (state.roomStatus !== 'BATTLE') return false;

    if (state.gameMode === '1v1') {
      const players = Array.from(state.players.values());
      if (players.length >= 2) {
        const alivePlayers = players.filter(p => p.alive && p.hp > 0);
        if (alivePlayers.length <= 1) {
          const winner = alivePlayers[0] || players[0];
          state.roomStatus = 'FINISHED';
          state.winnerId = winner.id;
          state.winnerName = winner.name;
          return true;
        }
      }
    } else if (state.gameMode === 'FFA') {
      const players = Array.from(state.players.values());
      const alivePlayers = players.filter(p => p.alive && p.hp > 0);
      if (players.length >= 2 && alivePlayers.length <= 1) {
        const winner = alivePlayers[0] || players[0];
        state.roomStatus = 'FINISHED';
        state.winnerId = winner.id;
        state.winnerName = winner.name;
        return true;
      }
    } else if (state.gameMode === '2v2') {
      const players = Array.from(state.players.values());
      const teamAAlive = players.some(p => p.team === 'A' && p.alive && p.hp > 0);
      const teamBAlive = players.some(p => p.team === 'B' && p.alive && p.hp > 0);

      if (!teamAAlive && teamBAlive) {
        state.roomStatus = 'FINISHED';
        state.winnerTeam = 'B';
        const teamBPlayers = players.filter(p => p.team === 'B');
        state.winnerName = teamBPlayers.map(p => p.name).join(' & ');
        return true;
      } else if (!teamBAlive && teamAAlive) {
        state.roomStatus = 'FINISHED';
        state.winnerTeam = 'A';
        const teamAPlayers = players.filter(p => p.team === 'A');
        state.winnerName = teamAPlayers.map(p => p.name).join(' & ');
        return true;
      }
    }

    return false;
  }
}
