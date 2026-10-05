/**
 * Server Arena Obstacles & Raycasting
 * Authoritative line-of-sight and collision checking
 */

import { raycastTerrain, resolveTerrainCollision, getTerrainNormal } from './shared/terrainPhysics.js';

export interface ArenaObstacle {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
}

export const ARENA_OBSTACLES: ArenaObstacle[] = [
  { id: 'obs_titan_alpha', name: 'Asteroid Titan-Alpha', position: [65, 5, -45], radius: 24 },
  { id: 'obs_titan_beta', name: 'Asteroid Titan-Beta', position: [-75, 12, 55], radius: 26 },
  { id: 'obs_monolith_core', name: 'Monolith Core Rock', position: [-80, -15, -85], radius: 22 },
  { id: 'obs_gorgon_cluster', name: 'Gorgon Rock Cluster', position: [0, -22, 90], radius: 20 },
  { id: 'obs_cestus_fragment', name: 'Cestus Fragment Spire', position: [95, 25, 65], radius: 19 },
  { id: 'obs_station_relay', name: 'Abandoned Orbital Station', position: [0, 22, -110], radius: 28 },
  { id: 'obs_cruiser_wreck', name: 'Derelict Cruiser Wreckage', position: [85, -12, -10], radius: 25 },
  { id: 'obs_habitat_ruin', name: 'Orbital Ring Segment', position: [-60, 28, -25], radius: 21 },
  { id: 'obs_debris_north', name: 'Debris Field Alpha', position: [-28, -8, -45], radius: 15 },
  { id: 'obs_debris_south', name: 'Debris Field Beta', position: [35, 15, 45], radius: 16 }
];

export interface RaycastResult {
  blocked: boolean;
  obstacle: ArenaObstacle | null;
  distance: number;
  hitPoint: [number, number, number] | null;
}

export function checkObstacleRaycast(
  startX: number,
  startY: number,
  startZ: number,
  endX: number,
  endY: number,
  endZ: number
): RaycastResult {
  const dx = endX - startX;
  const dy = endY - startY;
  const dz = endZ - startZ;
  const rayLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (rayLength <= 0.0001) {
    return { blocked: false, obstacle: null, distance: 0, hitPoint: null };
  }

  const dirX = dx / rayLength;
  const dirY = dy / rayLength;
  const dirZ = dz / rayLength;

  let closestHitDist = rayLength;
  let hitObstacle: ArenaObstacle | null = null;

  for (const obs of ARENA_OBSTACLES) {
    const ocX = obs.position[0] - startX;
    const ocY = obs.position[1] - startY;
    const ocZ = obs.position[2] - startZ;

    const tca = ocX * dirX + ocY * dirY + ocZ * dirZ;
    if (tca < 0) continue;

    const d2 = (ocX * ocX + ocY * ocY + ocZ * ocZ) - tca * tca;
    const r2 = obs.radius * obs.radius;
    if (d2 > r2) continue;

    const thc = Math.sqrt(r2 - d2);
    const hitT = tca - thc;
    if (hitT > 0 && hitT < closestHitDist) {
      closestHitDist = hitT;
      hitObstacle = obs;
    }
  }

  // Authoritative check against planetary alien terrain floor
  const terrainHit = raycastTerrain(startX, startY, startZ, endX, endY, endZ);
  if (terrainHit.hit && terrainHit.distance < closestHitDist) {
    closestHitDist = terrainHit.distance;
    hitObstacle = {
      id: 'obs_terrain_bedrock',
      name: 'Planetary Terrain Bedrock',
      position: terrainHit.hitPoint!,
      radius: 12
    };
    return {
      blocked: true,
      obstacle: hitObstacle,
      distance: closestHitDist,
      hitPoint: terrainHit.hitPoint
    };
  }

  if (hitObstacle) {
    return {
      blocked: true,
      obstacle: hitObstacle,
      distance: closestHitDist,
      hitPoint: [
        startX + dirX * closestHitDist,
        startY + dirY * closestHitDist,
        startZ + dirZ * closestHitDist
      ]
    };
  }

  return { blocked: false, obstacle: null, distance: rayLength, hitPoint: null };
}

/**
 * Authoritative continuous collision resolver for spaceships against all
 * obstacles, planetary terrain surface, and outer arena boundary.
 */
export function resolveShipMovementCollision(
  prevPos: { x: number; y: number; z: number },
  desiredPos: { x: number; y: number; z: number },
  shipRadius: number = 3.6
): {
  position: { x: number; y: number; z: number };
  collided: boolean;
  hitObstacle: ArenaObstacle | null;
  hitTerrain: boolean;
  normal: { x: number; y: number; z: number } | null;
} {
  let resolvedX = desiredPos.x;
  let resolvedY = desiredPos.y;
  let resolvedZ = desiredPos.z;
  let collided = false;
  let hitObs: ArenaObstacle | null = null;
  let hitTerr = false;
  let impactNormal: { x: number; y: number; z: number } | null = null;

  // 1. Check against all physical obstacles
  for (const obs of ARENA_OBSTACLES) {
    const ocX = resolvedX - obs.position[0];
    const ocY = resolvedY - obs.position[1];
    const ocZ = resolvedZ - obs.position[2];
    const dist = Math.hypot(ocX, ocY, ocZ);
    const minDist = obs.radius + shipRadius;

    if (dist < minDist) {
      collided = true;
      hitObs = obs;
      if (dist > 0.001) {
        const factor = minDist / dist;
        resolvedX = obs.position[0] + ocX * factor;
        resolvedY = obs.position[1] + ocY * factor;
        resolvedZ = obs.position[2] + ocZ * factor;
        impactNormal = {
          x: ocX / dist,
          y: ocY / dist,
          z: ocZ / dist
        };
      } else {
        const fromPrevX = prevPos.x - obs.position[0];
        const fromPrevY = prevPos.y - obs.position[1];
        const fromPrevZ = prevPos.z - obs.position[2];
        const pDist = Math.hypot(fromPrevX, fromPrevY, fromPrevZ);
        if (pDist > 0.001) {
          resolvedX = obs.position[0] + (fromPrevX / pDist) * minDist;
          resolvedY = obs.position[1] + (fromPrevY / pDist) * minDist;
          resolvedZ = obs.position[2] + (fromPrevZ / pDist) * minDist;
          impactNormal = { x: fromPrevX / pDist, y: fromPrevY / pDist, z: fromPrevZ / pDist };
        } else {
          resolvedY = obs.position[1] + minDist;
          impactNormal = { x: 0, y: 1, z: 0 };
        }
      }
      break;
    }
  }

  // 2. Check against planetary alien terrain floor
  const terrainRes = resolveTerrainCollision(resolvedX, resolvedY, resolvedZ, shipRadius);
  if (terrainRes.collided) {
    collided = true;
    hitTerr = true;
    resolvedY = terrainRes.resolvedY;
    impactNormal = terrainRes.normal;
  }

  // 3. Spherical arena forcefield boundary clamp (300m radius)
  const distFromCenter = Math.hypot(resolvedX, resolvedY, resolvedZ);
  const maxArenaR = 300 - shipRadius;
  if (distFromCenter > maxArenaR) {
    collided = true;
    const factor = maxArenaR / distFromCenter;
    resolvedX *= factor;
    resolvedY *= factor;
    resolvedZ *= factor;
    impactNormal = {
      x: -resolvedX / maxArenaR,
      y: -resolvedY / maxArenaR,
      z: -resolvedZ / maxArenaR
    };
  }

  return {
    position: { x: resolvedX, y: resolvedY, z: resolvedZ },
    collided,
    hitObstacle: hitObs,
    hitTerrain: hitTerr,
    normal: impactNormal
  };
}

/**
 * Swept Segment vs Sphere collision test
 */
export function checkSegmentSphereCollision(
  p1x: number, p1y: number, p1z: number,
  p2x: number, p2y: number, p2z: number,
  cx: number, cy: number, cz: number,
  radius: number
): { hit: boolean; distSq: number } {
  const vx = p2x - p1x;
  const vy = p2y - p1y;
  const vz = p2z - p1z;
  const segLenSq = vx * vx + vy * vy + vz * vz;

  if (segLenSq < 0.0001) {
    const dx = p1x - cx;
    const dy = p1y - cy;
    const dz = p1z - cz;
    const dSq = dx * dx + dy * dy + dz * dz;
    return { hit: dSq <= radius * radius, distSq: dSq };
  }

  const wx = cx - p1x;
  const wy = cy - p1y;
  const wz = cz - p1z;

  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy + wz * vz) / segLenSq));

  const closeX = p1x + t * vx;
  const closeY = p1y + t * vy;
  const closeZ = p1z + t * vz;

  const dx = closeX - cx;
  const dy = closeY - cy;
  const dz = closeZ - cz;
  const distSq = dx * dx + dy * dy + dz * dz;

  return { hit: distSq <= radius * radius, distSq };
}
