import { BattleStateSchema, PlayerSchema } from '../schema/BattleState.js';
import { GAME_CONFIG, Vector3D } from '../shared/gameConfig.js';
import { resolveShipMovementCollision } from '../arenaObstacles.js';

export class BoundarySystem {
  /**
   * Enforces authoritative physical terrain, obstacle, and 300m spherical battle zone limits
   */
  enforce(state: BattleStateSchema, dt: number) {
    state.players.forEach((player) => {
      if (!player.alive) return;

      const prevPos = { x: player.position.x, y: player.position.y, z: player.position.z };
      const res = resolveShipMovementCollision(prevPos, prevPos, 3.8);

      if (res.collided) {
        player.position.set(res.position.x, res.position.y, res.position.z);

        if (res.normal) {
          // Deflect velocity along collision surface normal
          const dot = player.velocity.x * res.normal.x +
                      player.velocity.y * res.normal.y +
                      player.velocity.z * res.normal.z;
          if (dot < 0) {
            player.velocity.set(
              player.velocity.x - res.normal.x * dot,
              player.velocity.y - res.normal.y * dot,
              player.velocity.z - res.normal.z * dot
            );
          }
        }
      }
    });
  }
}
