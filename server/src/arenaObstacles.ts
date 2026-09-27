/**
 * Server Arena Obstacles & Raycasting
 * Authoritative line-of-sight and collision checking
 */

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
 * Swept Segment vs Sphere collision test
 * Returns true if segment [p1 -> p2] intersects sphere with center and radius
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
