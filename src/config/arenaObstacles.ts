/**
 * Arena Obstacles & Tactical Cover Registry
 * Defines all physical obstructions in the 3D battle arena used for:
 * 1. 3D geometry rendering in BattleArena
 * 2. Bullet projectile collisions (shots blocked)
 * 3. Laser beam raycast line-of-sight tests (laser blocked)
 * 4. AI state machine cover finding & hiding
 * 5. Full-Screen Tactical Map rendering
 */

export interface ArenaObstacle {
  id: string;
  name: string;
  type: 'asteroid' | 'rock' | 'station' | 'wreck' | 'debris';
  position: [number, number, number];
  radius: number; // Collision and raycast blocking sphere radius
  isCover: boolean;
  tacticalLabel: string;
  description: string;
}

export const ARENA_OBSTACLES: ArenaObstacle[] = [
  // 1. Giant Cover Asteroids
  {
    id: 'obs_titan_alpha',
    name: 'Asteroid Titan-Alpha',
    type: 'asteroid',
    position: [65, 5, -45],
    radius: 24,
    isCover: true,
    tacticalLabel: 'TITAN-A',
    description: 'Massive iron-silicate asteroid. Complete cover from direct fire.'
  },
  {
    id: 'obs_titan_beta',
    name: 'Asteroid Titan-Beta',
    type: 'asteroid',
    position: [-75, 12, 55],
    radius: 26,
    isCover: true,
    tacticalLabel: 'TITAN-B',
    description: 'Porous carbonaceous asteroid with deep craters for tactical ambush.'
  },
  {
    id: 'obs_monolith_core',
    name: 'Monolith Core Rock',
    type: 'rock',
    position: [-80, -15, -85],
    radius: 22,
    isCover: true,
    tacticalLabel: 'MONOLITH',
    description: 'High-density mineral spire providing full ballistic shielding.'
  },
  {
    id: 'obs_gorgon_cluster',
    name: 'Gorgon Rock Cluster',
    type: 'rock',
    position: [0, -22, 90],
    radius: 20,
    isCover: true,
    tacticalLabel: 'GORGON-C',
    description: 'Rugged basalt formation at lower ventral quadrant.'
  },
  {
    id: 'obs_cestus_fragment',
    name: 'Cestus Fragment Spire',
    type: 'rock',
    position: [95, 25, 65],
    radius: 19,
    isCover: true,
    tacticalLabel: 'CESTUS',
    description: 'Angular titanium-rich asteroid fragment.'
  },

  // 2. Space Stations & Futuristic Structures
  {
    id: 'obs_station_relay',
    name: 'Abandoned Orbital Station',
    type: 'station',
    position: [0, 22, -110],
    radius: 28,
    isCover: true,
    tacticalLabel: 'STATION RUIN',
    description: 'Derelict colonial comms station with solar arrays and habit modules.'
  },

  // 3. Wrecked Spacecraft
  {
    id: 'obs_cruiser_wreck',
    name: 'Derelict Cruiser Wreckage',
    type: 'wreck',
    position: [85, -12, -10],
    radius: 25,
    isCover: true,
    tacticalLabel: 'CRUISER WRECK',
    description: 'Scattered warship hull plating offering extensive lateral protection.'
  },
  {
    id: 'obs_habitat_ruin',
    name: 'Orbital Ring Segment',
    type: 'wreck',
    position: [-60, 28, -25],
    radius: 21,
    isCover: true,
    tacticalLabel: 'HABITAT RING',
    description: 'Rotational centrifuge section from early frontier outpost.'
  },

  // 4. Debris Fields & Narrow Choke Points
  {
    id: 'obs_debris_north',
    name: 'Debris Field Alpha',
    type: 'debris',
    position: [-28, -8, -45],
    radius: 15,
    isCover: true,
    tacticalLabel: 'DEBRIS ALPHA',
    description: 'High-density orbital salvage field. Disperses beam weaponry.'
  },
  {
    id: 'obs_debris_south',
    name: 'Debris Field Beta',
    type: 'debris',
    position: [35, 15, 45],
    radius: 16,
    isCover: true,
    tacticalLabel: 'DEBRIS BETA',
    description: 'Planetary ring fragments creating a tactical corridor.'
  }
];

/**
 * Checks if a ray from start to end intersects any obstacle.
 * Returns intersection details including the blocking obstacle and hit point.
 */
export function checkObstacleRaycast(
  startX: number,
  startY: number,
  startZ: number,
  endX: number,
  endY: number,
  endZ: number
): { blocked: boolean; obstacle: ArenaObstacle | null; distance: number; hitPoint: [number, number, number] | null } {
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
    // Vector from ray origin to sphere center
    const ocX = obs.position[0] - startX;
    const ocY = obs.position[1] - startY;
    const ocZ = obs.position[2] - startZ;

    // Projection of oc onto ray direction
    const tca = ocX * dirX + ocY * dirY + ocZ * dirZ;
    if (tca < 0) continue; // Behind ray

    // Perpendicular distance squared from sphere center to ray
    const d2 = (ocX * ocX + ocY * ocY + ocZ * ocZ) - tca * tca;
    const r2 = obs.radius * obs.radius;
    if (d2 > r2) continue; // Ray misses sphere

    // Distance from projection point to sphere surface along ray
    const thc = Math.sqrt(r2 - d2);
    const t0 = tca - thc;
    const t1 = tca + thc;

    const hitT = t0 > 0 ? t0 : t1;
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
 * Finds the nearest cover obstacle relative to a given position
 */
export function getNearestCover(
  posX: number,
  posY: number,
  posZ: number
): { obstacle: ArenaObstacle; distance: number; coverPoint: [number, number, number] } | null {
  let nearest: ArenaObstacle | null = null;
  let minDistance = Infinity;

  for (const obs of ARENA_OBSTACLES) {
    if (!obs.isCover) continue;
    const dx = obs.position[0] - posX;
    const dy = obs.position[1] - posY;
    const dz = obs.position[2] - posZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = obs;
    }
  }

  if (!nearest) return null;

  return {
    obstacle: nearest,
    distance: minDistance,
    coverPoint: nearest.position
  };
}

/**
 * Calculates a tactical hiding position on the opposite side of the nearest obstacle relative to threat.
 */
export function getCoverHidingPosition(
  agentPos: [number, number, number],
  threatPos: [number, number, number]
): { position: [number, number, number]; obstacle: ArenaObstacle } | null {
  const cover = getNearestCover(agentPos[0], agentPos[1], agentPos[2]);
  if (!cover) return null;

  const obs = cover.obstacle;
  // Vector from threat to obstacle
  const awayX = obs.position[0] - threatPos[0];
  const awayY = obs.position[1] - threatPos[1];
  const awayZ = obs.position[2] - threatPos[2];
  const len = Math.sqrt(awayX * awayX + awayY * awayY + awayZ * awayZ);

  if (len < 0.001) {
    return {
      position: [obs.position[0], obs.position[1] + obs.radius + 8, obs.position[2]],
      obstacle: obs
    };
  }

  // Position behind obstacle with safe margin
  const safeMargin = obs.radius + 12;
  const hidePos: [number, number, number] = [
    obs.position[0] + (awayX / len) * safeMargin,
    obs.position[1] + (awayY / len) * safeMargin * 0.5,
    obs.position[2] + (awayZ / len) * safeMargin
  ];

  return { position: hidePos, obstacle: obs };
}

