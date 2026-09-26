import * as THREE from 'three';

// Cache generated textures so they are created once and reused across components
const textureCache = new Map<string, THREE.Texture>();
let cachedSpaceEnv: THREE.CubeTexture | null = null;

/**
 * Creates a Three.js DataTexture Normal Map directly from height derivatives.
 * Completely SSR and Node.js test friendly (does not require DOM document).
 */
function createNormalDataTexture(
  width: number,
  height: number,
  heightFn: (x: number, y: number) => number,
  strength = 1.0,
  wrap = true
): THREE.DataTexture {
  const heights = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      heights[y * width + x] = heightFn(x, y);
    }
  }

  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const xPrev = wrap ? (x - 1 + width) % width : Math.max(0, x - 1);
      const xNext = wrap ? (x + 1) % width : Math.min(width - 1, x + 1);
      const yPrev = wrap ? (y - 1 + height) % height : Math.max(0, y - 1);
      const yNext = wrap ? (y + 1) % height : Math.min(height - 1, y + 1);

      const dX = (heights[y * width + xNext] - heights[y * width + xPrev]) * strength;
      const dY = (heights[yNext * width + x] - heights[yPrev * width + x]) * strength;

      // Normal vector = normalize(-dX, -dY, 1.0)
      const nx = -dX;
      const ny = -dY;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const idx = (y * width + x) * 4;
      data[idx + 0] = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Brushed Metal Normal Map for aerospace hulls and titanium bulkheads.
 */
export function getBrushedMetalNormal(): THREE.Texture {
  const key = 'brushed_metal_normal';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const tex = createNormalDataTexture(256, 256, (x, y) => {
    const streak = Math.sin(y * 1.5) * 0.2 + Math.cos(y * 4.2) * 0.15;
    const noise = (Math.sin(x * 0.1 + y * 8.0) * 0.5 + 0.5) * 0.25;
    return streak + noise;
  }, 1.8);

  tex.repeat.set(4, 4);
  textureCache.set(key, tex);
  return tex;
}

/**
 * Procedural Planetary Regolith / Basalt Rock Normal Map.
 */
export function getTerrainRegolithNormal(): THREE.Texture {
  const key = 'terrain_regolith_normal';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const tex = createNormalDataTexture(256, 256, (x, y) => {
    const o1 = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.5;
    const o2 = Math.sin(x * 0.22 + y * 0.15) * 0.25;
    const o3 = Math.cos(x * 0.55 - y * 0.45) * 0.15;
    const micro = (Math.sin(x * 1.2) * Math.sin(y * 1.2)) * 0.1;
    return o1 + o2 + o3 + micro;
  }, 2.4);

  tex.repeat.set(16, 16);
  textureCache.set(key, tex);
  return tex;
}

/**
 * Procedural Fabric Weave Normal Map for Astronaut EVA Suit.
 */
export function getFabricWeaveNormal(): THREE.Texture {
  const key = 'fabric_weave_normal';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const tex = createNormalDataTexture(256, 256, (x, y) => {
    const wx = Math.sin(x * 0.8) * 0.5 + 0.5;
    const wy = Math.sin(y * 0.8) * 0.5 + 0.5;
    return (wx * wy) * 0.4 + (Math.sin(x * 1.6 + y * 1.6) * 0.1);
  }, 1.6);

  tex.repeat.set(8, 8);
  textureCache.set(key, tex);
  return tex;
}

/**
 * Procedural Asteroid Mineral Facet Normal Map.
 */
export function getAsteroidFacetNormal(): THREE.Texture {
  const key = 'asteroid_facet_normal';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const tex = createNormalDataTexture(256, 256, (x, y) => {
    const c1 = Math.abs(Math.sin(x * 0.12) - Math.cos(y * 0.12));
    const c2 = Math.sin(x * 0.35 + y * 0.2) * 0.3;
    return c1 * 0.6 + c2;
  }, 2.8);

  tex.repeat.set(3, 3);
  textureCache.set(key, tex);
  return tex;
}

/**
 * Procedural Lunar Cratered Regolith Normal Map.
 */
export function getMoonCraterNormal(): THREE.Texture {
  const key = 'moon_crater_normal';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const tex = createNormalDataTexture(256, 256, (x, y) => {
    let height = 0;
    const craters = [
      { cx: 60, cy: 75, r: 30, d: 0.8 },
      { cx: 170, cy: 110, r: 25, d: 0.7 },
      { cx: 110, cy: 190, r: 35, d: 0.9 },
      { cx: 200, cy: 45, r: 20, d: 0.6 }
    ];

    for (const c of craters) {
      const d = Math.hypot(x - c.cx, y - c.cy);
      if (d < c.r) {
        const u = d / c.r;
        const bowl = Math.cos(u * Math.PI) * c.d;
        height += bowl;
      }
    }
    height += (Math.sin(x * 0.4) * Math.cos(y * 0.4)) * 0.15;
    return height;
  }, 2.5);

  tex.repeat.set(4, 4);
  textureCache.set(key, tex);
  return tex;
}

/**
 * Procedural Roughness Variation Map to break up uniform reflections.
 */
export function getRoughnessNoiseMap(): THREE.Texture {
  const key = 'roughness_noise_map';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const data = new Uint8Array(256 * 256 * 4);
  for (let i = 0; i < 256 * 256; i++) {
    const x = i % 256;
    const y = Math.floor(i / 256);
    const n = (Math.sin(x * 0.15) * Math.cos(y * 0.15) * 0.5 + 0.5) * 60 +
              (Math.random() * 40) + 120;
    const val = Math.min(255, Math.max(0, Math.floor(n)));
    data[i * 4 + 0] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }

  const tex = new THREE.DataTexture(data, 256, 256, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Generates an analytical HDR Space Cube Environment Map with stellar nebulas
 * and distant stars to feed scene.environment for realistic PBR specular reflections.
 */
export function generateSpaceCubeEnvironment(): THREE.CubeTexture {
  if (cachedSpaceEnv) return cachedSpaceEnv;

  const size = 128;
  const faces: any[] = [];

  const faceConfigs = [
    { nebulaColor: '#0c2340', starDensity: 40 }, // px
    { nebulaColor: '#170d2b', starDensity: 35 }, // nx
    { nebulaColor: '#0a192f', starDensity: 50 }, // py (zenith)
    { nebulaColor: '#020617', starDensity: 20 }, // ny (nadir)
    { nebulaColor: '#1b1b3a', starDensity: 45 }, // pz
    { nebulaColor: '#0e2439', starDensity: 38 }  // nz
  ];

  if (typeof document !== 'undefined') {
    for (let f = 0; f < 6; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#02040a';
        ctx.fillRect(0, 0, size, size);

        const cfg = faceConfigs[f];
        const grad = ctx.createRadialGradient(size / 2, size / 2, 5, size / 2, size / 2, size * 0.7);
        grad.addColorStop(0, cfg.nebulaColor);
        grad.addColorStop(1, '#02040a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        for (let s = 0; s < cfg.starDensity; s++) {
          const sx = Math.random() * size;
          const sy = Math.random() * size;
          const brightness = Math.random() > 0.85 ? 1.0 : 0.6;
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.fillRect(sx, sy, 1, 1);
        }
      }
      faces.push(canvas);
    }
  } else {
    // Node.js environment fallback
    for (let f = 0; f < 6; f++) {
      faces.push({ width: size, height: size, data: new Uint8Array(size * size * 4) });
    }
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.needsUpdate = true;
  cachedSpaceEnv = cubeTexture;
  return cubeTexture;
}
