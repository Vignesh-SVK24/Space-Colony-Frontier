import { BattleStateSchema, ProjectileSchema, Vector3Schema } from '../schema/BattleState.js';
import { DamageSystem } from './DamageSystem.js';
import { ServerPhysicsWorld } from './ServerPhysicsWorld.js';
import { GAME_CONFIG, Vector3D } from '../shared/gameConfig.js';
import { v4 as uuidv4 } from 'uuid';

export class ProjectileSystem {
  private physicsWorld: ServerPhysicsWorld;
  private damageSystem: DamageSystem;

  constructor(physicsWorld: ServerPhysicsWorld, damageSystem: DamageSystem) {
    this.physicsWorld = physicsWorld;
    this.damageSystem = damageSystem;
  }

  /**
   * Spawn a new authoritative plasma bullet with swept segment tracking
   */
  spawnBullet(
    state: BattleStateSchema,
    shooterId: string,
    origin: Vector3D,
    direction: Vector3D,
    clientAttackId?: string
  ): ProjectileSchema | null {
    const shooter = state.players.get(shooterId);
    if (!shooter || !shooter.alive || shooter.hp <= 0) return null;

    // Bullet ammunition and reloading check
    if (shooter.isReloading || shooter.ammo <= 0) return null;

    // Deduct 1 ammo
    shooter.ammo -= 1;
    shooter.shotsFired += 1;

    // Start auto reload if magazine is empty
    if (shooter.ammo <= 0) {
      shooter.isReloading = true;
      shooter.reloadTimeRemaining = GAME_CONFIG.BULLET_RELOAD_MS / 1000;
    }

    const attackId = clientAttackId || `BULLET_${Date.now()}_${uuidv4().substring(0, 6)}`;
    const proj = new ProjectileSchema();
    proj.id = uuidv4();
    proj.attackId = attackId;
    proj.ownerId = shooterId;
    proj.weaponType = 'BULLET';
    proj.color = shooter.color;
    proj.team = shooter.team;
    proj.position.set(origin.x, origin.y, origin.z);
    proj.direction.set(direction.x, direction.y, direction.z);
    proj.speed = GAME_CONFIG.BULLET_SPEED;
    proj.damage = GAME_CONFIG.BULLET_DAMAGE;
    proj.spawnTime = Date.now();

    state.projectiles.push(proj);
    return proj;
  }

  /**
   * Update all live projectiles: swept continuous collision against obstacles and players
   */
  update(state: BattleStateSchema, dt: number): { hits: any[]; blocked: any[] } {
    const hits: any[] = [];
    const blocked: any[] = [];
    const now = Date.now();

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];

      // Expiration check
      if (now - proj.spawnTime > GAME_CONFIG.BULLET_LIFETIME_MS) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Compute step movement
      const stepDistance = proj.speed * dt;
      const prevPos: Vector3D = { x: proj.position.x, y: proj.position.y, z: proj.position.z };
      const nextPos: Vector3D = {
        x: prevPos.x + proj.direction.x * stepDistance,
        y: prevPos.y + proj.direction.y * stepDistance,
        z: prevPos.z + proj.direction.z * stepDistance
      };

      // 1. Swept collision against static arena obstacles FIRST
      const sweptObs = this.physicsWorld.checkSweptSphereVsObstacles(prevPos, nextPos, 0.4);
      let obstacleHitDist = Infinity;
      if (sweptObs.blocked && sweptObs.hitPoint) {
        obstacleHitDist = Math.hypot(
          sweptObs.hitPoint.x - prevPos.x,
          sweptObs.hitPoint.y - prevPos.y,
          sweptObs.hitPoint.z - prevPos.z
        );
      }

      // 2. Swept collision against all valid enemy spaceship hitboxes
      let closestEnemy: any = null;
      let closestEnemyDist = Infinity;

      state.players.forEach((target, targetId) => {
        if (targetId === proj.ownerId || !target.alive || target.hp <= 0) return;

        // Friendly-fire check for 2v2
        if (state.gameMode === '2v2' && proj.team !== 'NONE' && proj.team === target.team) {
          return;
        }

        // Segment to sphere test against target ship combat hitbox
        const tPos = target.position;
        const targetDist = this.distancePointToSegment(tPos, prevPos, nextPos);
        if (targetDist <= GAME_CONFIG.BULLET_HITBOX_RADIUS) {
          // Use the actual first intersection parameter, not distance from the
          // segment start to the sphere center. This prevents a farther target
          // from incorrectly winning when a nearer target is crossed first.
          const hitT = this.segmentSphereHitT(
            prevPos,
            nextPos,
            tPos,
            GAME_CONFIG.BULLET_HITBOX_RADIUS
          );

          if (hitT !== null && hitT < closestEnemyDist) {
            closestEnemyDist = hitT;
            closestEnemy = target;
          }
        }
      });

      // 3. Collision resolution: WHICHEVER COMES FIRST WINS
      if (sweptObs.blocked && obstacleHitDist < closestEnemyDist) {
        // Bullet blocked by obstacle
        blocked.push({
          attackId: proj.attackId,
          point: sweptObs.hitPoint,
          obstacle: sweptObs.obstacle?.name
        });
        state.projectiles.splice(i, 1);
      } else if (closestEnemy) {
        // Bullet hit enemy ship!
        const damageRes = this.damageSystem.applyDamage(state, {
          attackId: proj.attackId,
          attackerId: proj.ownerId,
          defenderId: closestEnemy.id,
          weaponType: 'BULLET',
          damage: GAME_CONFIG.BULLET_DAMAGE
        });

        if (damageRes.applied) {
          hits.push({
            attackId: proj.attackId,
            attackerId: proj.ownerId,
            defenderId: closestEnemy.id,
            damage: damageRes.damage,
            remainingHp: damageRes.remainingHp,
            eliminated: damageRes.eliminated,
            point: [closestEnemy.position.x, closestEnemy.position.y, closestEnemy.position.z]
          });
        }
        state.projectiles.splice(i, 1);
      } else {
        // Projectile continues flight
        proj.position.set(nextPos.x, nextPos.y, nextPos.z);
      }
    }

    return { hits, blocked };
  }

  private segmentSphereHitT(
    a: Vector3D,
    b: Vector3D,
    center: Vector3D,
    radius: number
  ): number | null {
    const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const m = { x: a.x - center.x, y: a.y - center.y, z: a.z - center.z };

    const aa = d.x * d.x + d.y * d.y + d.z * d.z;
    const bb = 2 * (m.x * d.x + m.y * d.y + m.z * d.z);
    const cc = m.x * m.x + m.y * m.y + m.z * m.z - radius * radius;

    if (aa <= 0.000001) {
      return cc <= 0 ? 0 : null;
    }

    const discriminant = bb * bb - 4 * aa * cc;
    if (discriminant < 0) return null;

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-bb - sqrtDisc) / (2 * aa);
    const t2 = (-bb + sqrtDisc) / (2 * aa);

    if (t1 >= 0 && t1 <= 1) return t1;
    if (t2 >= 0 && t2 <= 1) return t2;
    return null;
  }

  private distancePointToSegment(p: { x: number; y: number; z: number }, a: Vector3D, b: Vector3D): number {
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
    const abLenSq = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
    if (abLenSq <= 0.0001) {
      return Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z);
    }
    const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / abLenSq));
    const closest = {
      x: a.x + ab.x * t,
      y: a.y + ab.y * t,
      z: a.z + ab.z * t
    };
    return Math.hypot(p.x - closest.x, p.y - closest.y, p.z - closest.z);
  }
}
