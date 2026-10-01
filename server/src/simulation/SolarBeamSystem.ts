import { BattleStateSchema } from '../schema/BattleState.js';
import { DamageSystem } from './DamageSystem.js';
import { ServerPhysicsWorld } from './ServerPhysicsWorld.js';
import { GAME_CONFIG, Vector3D } from '../shared/gameConfig.js';
import { v4 as uuidv4 } from 'uuid';

export interface SolarBeamResult {
  valid: boolean;
  attackId: string;
  shooterId: string;
  start: [number, number, number];
  end: [number, number, number];
  blocked: boolean;
  hitTargetId?: string;
  damage: number;
  remainingHp?: number;
  eliminated?: boolean;
}

export class SolarBeamSystem {
  private physicsWorld: ServerPhysicsWorld;
  private damageSystem: DamageSystem;

  constructor(physicsWorld: ServerPhysicsWorld, damageSystem: DamageSystem) {
    this.physicsWorld = physicsWorld;
    this.damageSystem = damageSystem;
  }

  /**
   * Authoritative Solar Beam activation (30 HP damage, 10.0s recharge)
   */
  fireSolar(
    state: BattleStateSchema,
    shooterId: string,
    origin: Vector3D,
    direction: Vector3D,
    clientAttackId?: string
  ): SolarBeamResult {
    const shooter = state.players.get(shooterId);
    if (!shooter || !shooter.alive || shooter.hp <= 0) {
      return { valid: false, attackId: '', shooterId, start: [0,0,0], end: [0,0,0], blocked: false, damage: 0 };
    }

    // Cooldown check (10.0s enforced by server)
    if (shooter.solarCooldownRemaining > 0.05) {
      return { valid: false, attackId: '', shooterId, start: [0,0,0], end: [0,0,0], blocked: false, damage: 0 };
    }

    shooter.solarCooldownRemaining = GAME_CONFIG.SOLAR_RECHARGE_MS / 1000;
    shooter.shotsFired += 1;

    const attackId = clientAttackId || `SOLAR_${Date.now()}_${uuidv4().substring(0, 6)}`;
    const maxEnd: Vector3D = {
      x: origin.x + direction.x * GAME_CONFIG.SOLAR_RANGE,
      y: origin.y + direction.y * GAME_CONFIG.SOLAR_RANGE,
      z: origin.z + direction.z * GAME_CONFIG.SOLAR_RANGE
    };

    // 1. Raycast vs Obstacles
    const obsRay = this.physicsWorld.castRay(origin, maxEnd);
    let beamEnd: [number, number, number] = obsRay.blocked && obsRay.hitPoint
      ? [obsRay.hitPoint.x, obsRay.hitPoint.y, obsRay.hitPoint.z]
      : [maxEnd.x, maxEnd.y, maxEnd.z];

    let blockedByCover = obsRay.blocked;
    const obsDistance = obsRay.blocked ? obsRay.distance : Infinity;

    // 2. Check closest enemy spaceship along narrow ray
    let closestEnemy: any = null;
    let closestDist = Infinity;

    state.players.forEach((target, targetId) => {
      if (targetId === shooterId || !target.alive || target.hp <= 0) return;

      // 2v2 friendly-fire immunity
      if (state.gameMode === '2v2' && shooter.team !== 'NONE' && shooter.team === target.team) {
        return;
      }

      const toTarget = {
        x: target.position.x - origin.x,
        y: target.position.y - origin.y,
        z: target.position.z - origin.z
      };
      const dist = Math.hypot(toTarget.x, toTarget.y, toTarget.z);
      if (dist <= GAME_CONFIG.SOLAR_RANGE && dist < obsDistance) {
        const norm = { x: toTarget.x / dist, y: toTarget.y / dist, z: toTarget.z / dist };
        const dot = direction.x * norm.x + direction.y * norm.y + direction.z * norm.z;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

        // Use perpendicular distance to the beam centerline. This makes the
        // beam feel precise but still gives the player a fair hitbox.
        const perpendicularDistance = dist * Math.sin(angle);
        const hitRadius = GAME_CONFIG.BULLET_HITBOX_RADIUS;

        if ((angle < GAME_CONFIG.SOLAR_AIM_CONE || perpendicularDistance <= hitRadius) && dist < closestDist) {
          closestDist = dist;
          closestEnemy = target;
        }
      }
    });

    if (closestEnemy) {
      beamEnd = [closestEnemy.position.x, closestEnemy.position.y, closestEnemy.position.z];
      blockedByCover = false;

      const damageRes = this.damageSystem.applyDamage(state, {
        attackId,
        attackerId: shooterId,
        defenderId: closestEnemy.id,
        weaponType: 'SOLAR_BEAM',
        damage: GAME_CONFIG.SOLAR_DAMAGE
      });

      return {
        valid: true,
        attackId,
        shooterId,
        start: [origin.x, origin.y, origin.z],
        end: beamEnd,
        blocked: false,
        hitTargetId: closestEnemy.id,
        damage: damageRes.damage,
        remainingHp: damageRes.remainingHp,
        eliminated: damageRes.eliminated
      };
    }

    return {
      valid: true,
      attackId,
      shooterId,
      start: [origin.x, origin.y, origin.z],
      end: beamEnd,
      blocked: blockedByCover,
      damage: 0
    };
  }
}
