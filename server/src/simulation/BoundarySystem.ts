import { BattleStateSchema, PlayerSchema } from '../schema/BattleState.js';
import { GAME_CONFIG, Vector3D } from '../shared/gameConfig.js';

export class BoundarySystem {
  /**
   * Enforces 300m spherical battle zone limits
   */
  enforce(state: BattleStateSchema, dt: number) {
    const maxRadius = GAME_CONFIG.ARENA_RADIUS;

    state.players.forEach((player) => {
      if (!player.alive) return;

      const px = player.position.x;
      const py = player.position.y;
      const pz = player.position.z;
      const dist = Math.hypot(px, py, pz);

      if (dist > maxRadius) {
        // Clamp to sphere boundary
        const factor = maxRadius / dist;
        player.position.set(px * factor, py * factor, pz * factor);

        // Cancel outward velocity
        const vx = player.velocity.x;
        const vy = player.velocity.y;
        const vz = player.velocity.z;
        const dot = (px * vx + py * vy + pz * vz) / dist;
        if (dot > 0) {
          player.velocity.set(
            vx - (px / dist) * dot,
            vy - (py / dist) * dot,
            vz - (pz / dist) * dot
          );
        }
      }
    });
  }
}
