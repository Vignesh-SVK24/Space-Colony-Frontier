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

/**
 * Procedural Organic Nebula Gas Cloud Texture
 * Generates an organic cloud puff with radial Gaussian alpha falloff to 0 at perimeter,
 * ensuring zero hard edges or boxy outlines.
 */
export function getNebulaCloudTexture(variant: 'violet' | 'cyan' | 'amber' | 'galaxy' = 'violet'): THREE.Texture {
  const key = `nebula_cloud_${variant}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const cx = size / 2;
      const cy = size / 2;

      // Color scheme based on variant
      const colors = {
        violet: { core: 'rgba(168, 85, 247, 0.85)', mid: 'rgba(126, 34, 206, 0.45)', outer: 'rgba(59, 7, 100, 0.15)' },
        cyan: { core: 'rgba(56, 189, 248, 0.85)', mid: 'rgba(14, 116, 144, 0.45)', outer: 'rgba(8, 51, 68, 0.15)' },
        amber: { core: 'rgba(251, 191, 36, 0.85)', mid: 'rgba(217, 119, 6, 0.45)', outer: 'rgba(120, 53, 15, 0.15)' },
        galaxy: { core: 'rgba(255, 255, 255, 0.95)', mid: 'rgba(192, 132, 252, 0.55)', outer: 'rgba(30, 58, 138, 0.12)' }
      }[variant];

      const radGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, cx * 0.92);
      radGrad.addColorStop(0, colors.core);
      radGrad.addColorStop(0.35, colors.mid);
      radGrad.addColorStop(0.7, colors.outer);
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, size, size);

      // Add organic density filaments
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (cx * 0.65);
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const r = 18 + Math.random() * 32;

        const puffGrad = ctx.createRadialGradient(px, py, 2, px, py, r);
        puffGrad.addColorStop(0, colors.mid);
        puffGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    textureCache.set(key, tex);
    return tex;
  }

  // Node.js fallback
  const dummy = new THREE.DataTexture(new Uint8Array(size * size * 4), size, size, THREE.RGBAFormat);
  textureCache.set(key, dummy);
  return dummy;
}

/**
 * Procedural Jovian Gas Giant Atmospheric Banding Texture
 */
export function getGasGiantTexture(): THREE.Texture {
  const key = 'planet_gas_giant';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const width = 512;
  const height = 256;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base atmospheric bands
      const bands = [
        '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b',
        '#fef3c7', '#d97706', '#92400e', '#78350f', '#451a03'
      ];

      for (let y = 0; y < height; y++) {
        const t = y / height;
        const bandIdx = Math.floor(t * bands.length);
        const baseColor = bands[Math.min(bandIdx, bands.length - 1)];
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, y, width, 1);

        // Micro turbulent noise
        const noise = Math.sin(y * 0.18) * 15;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(y * 0.08)) * 0.12})`;
        ctx.fillRect(0, y, width, 1);
      }

      // Atmospheric Great Storm Vortex (Great Red/Amber Spot)
      const stormX = width * 0.62;
      const stormY = height * 0.64;
      const stormGrad = ctx.createRadialGradient(stormX, stormY, 4, stormX, stormY, 32);
      stormGrad.addColorStop(0, '#dc2626');
      stormGrad.addColorStop(0.5, '#ea580c');
      stormGrad.addColorStop(0.85, '#b45309');
      stormGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');

      ctx.fillStyle = stormGrad;
      ctx.beginPath();
      ctx.ellipse(stormX, stormY, 32, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    textureCache.set(key, tex);
    return tex;
  }

  const dummy = new THREE.DataTexture(new Uint8Array(width * height * 4), width, height, THREE.RGBAFormat);
  textureCache.set(key, dummy);
  return dummy;
}

/**
 * Procedural Gas Giant Rings Texture with Cassini divisions
 */
export function getGasGiantRingsTexture(): THREE.Texture {
  const key = 'planet_gas_giant_rings';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        // Inner transparency
        if (u < 0.15 || u > 0.95) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        } else if (u > 0.58 && u < 0.64) {
          // Cassini Division dark gap
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        } else {
          const density = Math.sin(u * Math.PI * 18) * 0.25 + 0.65;
          const alpha = density * (u < 0.3 ? (u - 0.15) / 0.15 : (0.95 - u) / 0.3);
          ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0, Math.min(0.9, alpha))})`;
        }
        ctx.fillRect(x, 0, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    textureCache.set(key, tex);
    return tex;
  }

  const dummy = new THREE.DataTexture(new Uint8Array(size * 4), size, 1, THREE.RGBAFormat);
  textureCache.set(key, dummy);
  return dummy;
}

/**
 * Procedural Colony World Planetary Texture (Gaia Nova)
 * Displays azure oceans, green/brown continents, swirling cloud weather systems,
 * and night-side glowing colony city clusters.
 */
export function getColonyPlanetTexture(): THREE.Texture {
  const key = 'planet_colony_world';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const width = 512;
  const height = 256;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Ocean base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Deep ocean variations
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#0c4a6e');
      oceanGrad.addColorStop(0.5, '#0284c7');
      oceanGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // Continents (organic blobs)
      ctx.fillStyle = '#15803d'; // Forest/biome green
      for (let i = 0; i < 18; i++) {
        const cx = (i * 37) % width;
        const cy = 40 + ((i * 29) % (height - 80));
        const rx = 35 + (i % 5) * 12;
        const ry = 22 + (i % 4) * 8;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, (i * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      // Swirling white cloud formations
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let c = 0; c < 14; c++) {
        const y = 30 + c * 16;
        ctx.beginPath();
        ctx.ellipse(width * (c / 14), y, 60, 6, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Night-side glowing colony city grids (emissive dots)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)'; // Warm golden metropolis lights
      for (let s = 0; s < 45; s++) {
        const sx = (s * 41 + 15) % width;
        const sy = 55 + ((s * 31) % (height - 110));
        ctx.fillRect(sx, sy, 2, 2);
        ctx.fillRect(sx + 3, sy + 1, 1, 1);
        ctx.fillRect(sx - 2, sy + 2, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    textureCache.set(key, tex);
    return tex;
  }

  const dummy = new THREE.DataTexture(new Uint8Array(width * height * 4), width, height, THREE.RGBAFormat);
  textureCache.set(key, dummy);
  return dummy;
}

/**
 * Procedural Volcanic World Texture (Pyros)
 * Dark basalt tectonic plates with incandescent magma fissures.
 */
export function getVolcanicPlanetTexture(): THREE.Texture {
  const key = 'planet_volcanic_pyros';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const width = 512;
  const height = 256;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark basalt crust
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Tectonic magma rifts
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      for (let r = 0; r < 20; r++) {
        ctx.beginPath();
        let x = (r * 33) % width;
        let y = (r * 19) % height;
        ctx.moveTo(x, y);
        for (let seg = 0; seg < 5; seg++) {
          x += (Math.random() - 0.5) * 50;
          y += (Math.random() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Blazing hot magma core fissures
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 14; r++) {
        ctx.beginPath();
        let x = (r * 47) % width;
        let y = (r * 23) % height;
        ctx.moveTo(x, y);
        for (let seg = 0; seg < 4; seg++) {
          x += (Math.random() - 0.5) * 40;
          y += (Math.random() - 0.5) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    textureCache.set(key, tex);
    return tex;
  }

  const dummy = new THREE.DataTexture(new Uint8Array(width * height * 4), width, height, THREE.RGBAFormat);
  textureCache.set(key, dummy);
  return dummy;
}
