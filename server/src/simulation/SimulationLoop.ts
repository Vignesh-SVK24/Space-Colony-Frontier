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
  public lastTickDurationMs = 0;
  public maxTickDurationMs = 0;

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
    const tickStart = performance.now();
    state.serverTick += 1;

    // 1. Advance match countdown if active
    if (state.roomStatus === 'COUNTDOWN') {
      state.countdown -= dt;
      if (state.countdown <= 0) {
        state.roomStatus = 'BATTLE';
        state.countdown = 0;
      }
      this.recordTickDuration(tickStart);
      return { hits: [], blocked: [], matchEnded: false };
    }

    if (state.roomStatus !== 'BATTLE') {
      this.recordTickDuration(tickStart);
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
    this.recordTickDuration(tickStart);

    return {
      hits: projResult.hits,
      blocked: projResult.blocked,
      matchEnded
    };
  }

  private recordTickDuration(tickStart: number) {
    const elapsed = performance.now() - tickStart;
    this.lastTickDurationMs = elapsed;
    if (elapsed > this.maxTickDurationMs) {
      this.maxTickDurationMs = elapsed;
    }
  }

  private checkWinCondition(state: BattleStateSchema): boolean {
    if (state.roomStatus !== 'BATTLE') return false;
    const totalPlayers = state.players.size;
    if (totalPlayers < 2) return false;

    if (state.gameMode === '1v1' || state.gameMode === 'FFA') {
      let aliveCount = 0;
      let lastAlive: any = null;
      let topDamagePlayer: any = null;

      state.players.forEach((p) => {
        if (p.alive && p.hp > 0) {
          aliveCount += 1;
          lastAlive = p;
        }
        if (!topDamagePlayer || p.damageDealt > topDamagePlayer.damageDealt) {
          topDamagePlayer = p;
        }
      });

      if (aliveCount <= 1) {
        const winner = aliveCount === 1 ? lastAlive : topDamagePlayer;
        if (winner) {
          state.roomStatus = 'FINISHED';
          state.winnerId = winner.sessionId || winner.id;
          state.winnerName = winner.name;
          return true;
        }
      }
    } else if (state.gameMode === '2v2') {
      let teamAAlive = false;
      let teamBAlive = false;

      state.players.forEach((p) => {
        if (p.alive && p.hp > 0) {
          if (p.team === 'A') teamAAlive = true;
          else if (p.team === 'B') teamBAlive = true;
        }
      });

      if (!teamAAlive && teamBAlive) {
        state.roomStatus = 'FINISHED';
        state.winnerTeam = 'B';
        const names: string[] = [];
        let winId = '';
        state.players.forEach((p) => {
          if (p.team === 'B') {
            names.push(p.name);
            if (!winId || (p.alive && p.hp > 0)) winId = p.sessionId || winId;
          }
        });
        state.winnerName = names.join(' & ');
        state.winnerId = winId;
        return true;
      } else if (!teamBAlive && teamAAlive) {
        state.roomStatus = 'FINISHED';
        state.winnerTeam = 'A';
        const names: string[] = [];
        let winId = '';
        state.players.forEach((p) => {
          if (p.team === 'A') {
            names.push(p.name);
            if (!winId || (p.alive && p.hp > 0)) winId = p.sessionId || winId;
          }
        });
        state.winnerName = names.join(' & ');
        state.winnerId = winId;
        return true;
      }
    }

    return false;
  }
}
