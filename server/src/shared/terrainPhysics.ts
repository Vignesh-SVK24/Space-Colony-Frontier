/**
 * Space Colony: Frontier - Server Planetary Alien Terrain & Map Physics System
 * 
 * Defines deterministic 3D battle-world terrain geometry, physical collision boundaries,
 * and ballistic raycast obstruction for authoritative server simulation.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export const TERRAIN_CONFIG = {
  BASE_Y: -125,
  ARENA_RADIUS: 300,
  
  // Tactical Landmark 1: Caloris Impact Crater (Ambush Basin)
  CRATER: {
    x: 65,
    z: -55,
    radius: 46,
    depth: 22,
    rimHeight: 12
  },

  // Tactical Landmark 2: Basalt Volcanic Spine / Ridge (Full Cover Barrier)
  RIDGE: {
    startX: -80,
    startZ: 25,
    endX: -20,
    endZ: 85,
    halfWidth: 26,
    height: 32
  },

  // Tactical Landmark 3: Obsidian Plateau Mesa (Elevated Sniping Outcrop)
  MESA: {
    x: -95,
    z: -85,
    radius: 36,
    height: 28
  },

  // Tactical Landmark 4: Emerald Chasm / Fissure
  CANYON: {
    centerZ: -10,
    width: 28,
    depth: 18,
    length: 180
  }
} as const;

/**
 * Calculates the exact deterministic height of the planetary battle terrain at (x, z).
 */
export function getTerrainHeight(x: number, z: number): number {
  let h = TERRAIN_CONFIG.BASE_Y;

  // 1. Boundary Bowl Curvature: Smoothly ascends at arena perimeter to merge with 300m forcefield
  const r = Math.hypot(x, z);
  if (r > 190) {
    const edgeT = Math.min(1.0, (r - 190) / 100);
    h += Math.pow(edgeT, 2.2) * 58;
  }

  // 2. Rolling Basalt Dunes & Alien Rock Stratum
  const undulatingHarmonics =
    Math.sin(x * 0.038) * Math.cos(z * 0.038) * 5.2 +
    Math.sin(x * 0.082 + 1.4) * Math.cos(z * 0.075 + 0.8) * 2.8 +
    Math.sin((x + z) * 0.02) * 3.5;
  h += undulatingHarmonics;

  // 3. Landmark 1: Caloris Impact Crater (Basin + Raised Rim)
  const dCrater = Math.hypot(x - TERRAIN_CONFIG.CRATER.x, z - TERRAIN_CONFIG.CRATER.z);
  if (dCrater < TERRAIN_CONFIG.CRATER.radius) {
    const t = dCrater / TERRAIN_CONFIG.CRATER.radius;
    const depression = (1.0 - Math.pow(t, 2)) * TERRAIN_CONFIG.CRATER.depth;
    const rimEffect = Math.exp(-Math.pow((t - 0.9) * 4.5, 2)) * TERRAIN_CONFIG.CRATER.rimHeight;
    h += -depression + rimEffect;
  }

  // 4. Landmark 2: Basalt Volcanic Spine / Ridge (Sharp Crest)
  const ridgeStart = { x: TERRAIN_CONFIG.RIDGE.startX, z: TERRAIN_CONFIG.RIDGE.startZ };
  const ridgeEnd = { x: TERRAIN_CONFIG.RIDGE.endX, z: TERRAIN_CONFIG.RIDGE.endZ };
  const dRidge = distanceToSegment2D(x, z, ridgeStart.x, ridgeStart.z, ridgeEnd.x, ridgeEnd.z);
  if (dRidge < TERRAIN_CONFIG.RIDGE.halfWidth) {
    const tRidge = 1.0 - (dRidge / TERRAIN_CONFIG.RIDGE.halfWidth);
    const ridgeSpire = (Math.cos((1.0 - tRidge) * Math.PI) + 1.0) * 0.5 * TERRAIN_CONFIG.RIDGE.height;
    h += ridgeSpire;
  }

  // 5. Landmark 3: Obsidian Plateau Mesa
  const dMesa = Math.hypot(x - TERRAIN_CONFIG.MESA.x, z - TERRAIN_CONFIG.MESA.z);
  if (dMesa < TERRAIN_CONFIG.MESA.radius) {
    const tMesa = dMesa / TERRAIN_CONFIG.MESA.radius;
    const cliffT = 1.0 / (1.0 + Math.exp((tMesa - 0.75) * 14.0));
    h += cliffT * TERRAIN_CONFIG.MESA.height;
  }

  // 6. Landmark 4: Emerald Chasm Canyon
  if (Math.abs(z - TERRAIN_CONFIG.CANYON.centerZ) < TERRAIN_CONFIG.CANYON.width && Math.abs(x) < TERRAIN_CONFIG.CANYON.length * 0.5) {
    const tCanyon = Math.abs(z - TERRAIN_CONFIG.CANYON.centerZ) / TERRAIN_CONFIG.CANYON.width;
    const canyonDip = (1.0 - Math.pow(tCanyon, 2)) * TERRAIN_CONFIG.CANYON.depth;
    h -= canyonDip;
  }

  return h;
}

/**
 * Calculates the exact surface normal vector of the terrain at (x, z).
 */
export function getTerrainNormal(x: number, z: number): Vector3D {
  const eps = 1.0;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);

  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);
  const len = Math.hypot(-dx, 1.0, -dz);

  return {
    x: -dx / len,
    y: 1.0 / len,
    z: -dz / len
  };
}

/**
 * Checks if a 3D ray segment from start to end intersects the planetary terrain surface.
 */
export function raycastTerrain(
  startX: number,
  startY: number,
  startZ: number,
  endX: number,
  endY: number,
  endZ: number
): { hit: boolean; distance: number; hitPoint: [number, number, number] | null } {
  const dx = endX - startX;
  const dy = endY - startY;
  const dz = endZ - startZ;
  const totalDist = Math.hypot(dx, dy, dz);
  if (totalDist <= 0.001) return { hit: false, distance: 0, hitPoint: null };

  const startH = getTerrainHeight(startX, startZ);
  const endH = getTerrainHeight(endX, endZ);

  if (startY > -80 && endY > -80) {
    return { hit: false, distance: totalDist, hitPoint: null };
  }

  const steps = 16;
  let prevX = startX;
  let prevY = startY;
  let prevZ = startZ;
  let prevDiff = prevY - startH;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const curX = startX + dx * t;
    const curY = startY + dy * t;
    const curZ = startZ + dz * t;
    const curH = getTerrainHeight(curX, curZ);
    const curDiff = curY - curH;

    if (curDiff <= 0 && prevDiff >= 0) {
      const alpha = prevDiff / (prevDiff - curDiff);
      const hitX = prevX + (curX - prevX) * alpha;
      const hitY = prevY + (curY - prevY) * alpha;
      const hitZ = prevZ + (curZ - prevZ) * alpha;
      const hitDist = Math.hypot(hitX - startX, hitY - startY, hitZ - startZ);

      return {
        hit: true,
        distance: hitDist,
        hitPoint: [hitX, hitY, hitZ]
      };
    }

    prevX = curX;
    prevY = curY;
    prevZ = curZ;
    prevDiff = curDiff;
  }

  return { hit: false, distance: totalDist, hitPoint: null };
}

/**
 * Resolves physical sphere collision against terrain (prevents tunneling & clipping).
 */
export function resolveTerrainCollision(
  x: number,
  y: number,
  z: number,
  radius: number = 3.5
): { collided: boolean; resolvedY: number; normal: Vector3D } {
  const groundH = getTerrainHeight(x, z);
  const minY = groundH + radius;

  if (y < minY) {
    const normal = getTerrainNormal(x, z);
    return {
      collided: true,
      resolvedY: minY,
      normal
    };
  }

  return {
    collided: false,
    resolvedY: y,
    normal: { x: 0, y: 1, z: 0 }
  };
}

function distanceToSegment2D(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const abLenSq = abx * abx + abz * abz;
  if (abLenSq <= 0.0001) return Math.hypot(px - ax, pz - az);

  const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}
