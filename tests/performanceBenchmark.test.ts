import { describe, it, expect } from 'vitest';
import { SimulationLoop } from '../server/src/simulation/SimulationLoop';
import { BattleStateSchema, PlayerSchema } from '../server/src/schema/BattleState';
import { GAME_CONFIG } from '../server/src/shared/gameConfig';

describe('4-Player Server Simulation Performance Benchmark', () => {
  it('should simulate 300 ticks (10s @ 30Hz) with 4 players and active projectiles well under 33.3ms tick budget', async () => {
    const sim = new SimulationLoop();
    await sim.init();

    const state = new BattleStateSchema();
    state.gameMode = 'FFA';
    state.roomStatus = 'BATTLE';

    const spawns = [
      [0, 0, -80],
      [0, 0, 80],
      [-80, 15, 0],
      [80, -15, 0]
    ];

    for (let i = 0; i < 4; i++) {
      const p = new PlayerSchema();
      p.id = `bench_p_${i}`;
      p.sessionId = `bench_sess_${i}`;
      p.name = `Pilot-${i + 1}`;
      p.hp = GAME_CONFIG.MAX_HP;
      p.maxHp = GAME_CONFIG.MAX_HP;
      p.ammo = GAME_CONFIG.BULLET_MAGAZINE_SIZE;
      p.alive = true;
      p.position.set(spawns[i][0], spawns[i][1], spawns[i][2]);
      state.players.set(p.sessionId, p);
    }

    const dt = 1 / GAME_CONFIG.SERVER_TICK_RATE;
    let totalTickMs = 0;

    for (let tick = 0; tick < 300; tick++) {
      // Spawn bursts of projectiles from all 4 players every 5 ticks
      if (tick % 5 === 0) {
        for (let i = 0; i < 4; i++) {
          const p = state.players.get(`bench_sess_${i}`)!;
          if (p.ammo <= 0) {
            p.ammo = GAME_CONFIG.BULLET_MAGAZINE_SIZE;
            p.isReloading = false;
          }
          sim.projectileSystem.spawnBullet(
            state,
            p.sessionId,
            { x: p.position.x, y: p.position.y, z: p.position.z },
            { x: i % 2 === 0 ? 0.5 : -0.5, y: 0, z: i < 2 ? 1 : -1 },
            `bench_atk_${tick}_${i}`
          );
        }
      }

      sim.update(state, dt);
      totalTickMs += sim.lastTickDurationMs;
    }

    const avgTickMs = totalTickMs / 300;
    console.log(
      `[BENCHMARK] 4-Player 300-tick average: ${avgTickMs.toFixed(3)}ms | max: ${sim.maxTickDurationMs.toFixed(3)}ms`
    );

    expect(avgTickMs).toBeLessThan(10);
    expect(sim.maxTickDurationMs).toBeLessThan(33.3);
  });
});
