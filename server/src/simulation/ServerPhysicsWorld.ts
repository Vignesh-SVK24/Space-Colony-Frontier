import RAPIER from '@dimforge/rapier3d-compat';
import { ARENA_OBSTACLES, ArenaObstacle } from '../arenaObstacles.js';
import { GAME_CONFIG, Vector3D } from '../shared/gameConfig.js';
import { raycastTerrain } from '../shared/terrainPhysics.js';

export interface RaycastHit {
  blocked: boolean;
  hitPoint: Vector3D | null;
  distance: number;
  obstacle: ArenaObstacle | null;
}

export class ServerPhysicsWorld {
  public world!: RAPIER.World;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    await RAPIER.init();
    const gravity = { x: 0, y: 0, z: 0 };
    this.world = new RAPIER.World(gravity);

    // Create Rapier static colliders for all tactical obstacles
    for (const obs of ARENA_OBSTACLES) {
      const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
        obs.position[0],
        obs.position[1],
        obs.position[2]
      );
      const rigidBody = this.world.createRigidBody(rigidBodyDesc);
      const colliderDesc = RAPIER.ColliderDesc.ball(obs.radius);
      this.world.createCollider(colliderDesc, rigidBody);
    }

    // Create Rapier static terrain foundation colliders
    const terrainBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -145, 0);
    const terrainBody = this.world.createRigidBody(terrainBodyDesc);
    const terrainCollider = RAPIER.ColliderDesc.cuboid(300, 20, 300);
    this.world.createCollider(terrainCollider, terrainBody);

    this.initialized = true;
  }

  /**
   * Raycast through Rapier World & Planetary Terrain to check for obstacle obstruction
   */
  castRay(start: Vector3D, end: Vector3D): RaycastHit {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const maxToi = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (maxToi <= 0.0001) {
      return { blocked: false, hitPoint: null, distance: 0, obstacle: null };
    }

    const dir = { x: dx / maxToi, y: dy / maxToi, z: dz / maxToi };
    const ray = new RAPIER.Ray(start, dir);
    const hit = this.world.castRay(ray, maxToi, true);

    let closestDist = maxToi;
    let hitPoint: Vector3D | null = null;
    let hitObs: ArenaObstacle | null = null;
    let blocked = false;

    if (hit) {
      const toi = hit.timeOfImpact;
      closestDist = toi;
      hitPoint = {
        x: start.x + dir.x * toi,
        y: start.y + dir.y * toi,
        z: start.z + dir.z * toi
      };
      blocked = true;

      // Match closest obstacle by distance
      let minObsDist = Infinity;
      for (const obs of ARENA_OBSTACLES) {
        const d = Math.hypot(obs.position[0] - hitPoint.x, obs.position[1] - hitPoint.y, obs.position[2] - hitPoint.z);
        if (d < obs.radius + 1.0 && d < minObsDist) {
          minObsDist = d;
          hitObs = obs;
        }
      }
    }

    // Check analytical planetary terrain intersection only if ray descends near or below terrain max elevation (-70)
    if (Math.min(start.y, end.y) <= -70) {
      const terrainHit = raycastTerrain(start.x, start.y, start.z, end.x, end.y, end.z);
      if (terrainHit.hit && terrainHit.distance < closestDist) {
        closestDist = terrainHit.distance;
        hitPoint = {
          x: terrainHit.hitPoint![0],
          y: terrainHit.hitPoint![1],
          z: terrainHit.hitPoint![2]
        };
        hitObs = {
          id: 'obs_terrain_bedrock',
          name: 'Planetary Terrain Bedrock',
          position: [hitPoint.x, hitPoint.y, hitPoint.z],
          radius: 12
        };
        blocked = true;
      }
    }

    if (blocked && hitPoint) {
      return {
        blocked: true,
        hitPoint,
        distance: closestDist,
        obstacle: hitObs
      };
    }

    return { blocked: false, hitPoint: null, distance: maxToi, obstacle: null };
  }

  /**
   * Continuous swept sphere intersection against an obstacle and terrain
   */
  checkSweptSphereVsObstacles(p1: Vector3D, p2: Vector3D, radius: number): RaycastHit {
    const rayHit = this.castRay(p1, p2);
    if (rayHit.blocked) {
      return rayHit;
    }

    // Secondary check against known obstacles spheres
    const segDir = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const segLen = Math.hypot(segDir.x, segDir.y, segDir.z);
    if (segLen <= 0.0001) return { blocked: false, hitPoint: null, distance: 0, obstacle: null };

    const u = { x: segDir.x / segLen, y: segDir.y / segLen, z: segDir.z / segLen };

    for (const obs of ARENA_OBSTACLES) {
      const oc = {
        x: obs.position[0] - p1.x,
        y: obs.position[1] - p1.y,
        z: obs.position[2] - p1.z
      };
      const t = oc.x * u.x + oc.y * u.y + oc.z * u.z;
      const clampedT = Math.max(0, Math.min(segLen, t));
      const closestPoint = {
        x: p1.x + u.x * clampedT,
        y: p1.y + u.y * clampedT,
        z: p1.z + u.z * clampedT
      };
      const distToCenter = Math.hypot(
        closestPoint.x - obs.position[0],
        closestPoint.y - obs.position[1],
        closestPoint.z - obs.position[2]
      );
      if (distToCenter < (obs.radius + radius)) {
        return {
          blocked: true,
          hitPoint: closestPoint,
          distance: clampedT,
          obstacle: obs
        };
      }
    }

    return { blocked: false, hitPoint: null, distance: segLen, obstacle: null };
  }

  step() {
    this.world.step();
  }
}
