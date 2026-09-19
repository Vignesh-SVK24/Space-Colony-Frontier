import * as THREE from 'three';
import { BiomeType } from '../../../state/useNexusGameStore';

export const BASE_SURFACE_Y = -1.4;

export function getTerrainHeight(x: number, z: number): number {
  const dOrigin = Math.hypot(x, z);
  const plateauFactor = THREE.MathUtils.smoothstep(dOrigin, 14, 28);

  const wave1 = Math.sin(x * 0.035 + 0.5) * Math.cos(z * 0.03) * 4.2;
  const wave2 = Math.sin(x * 0.08 - z * 0.07 + 1.2) * 2.0;
  const detail = Math.sin(x * 0.18 + z * 0.15) * Math.cos(x * 0.12 - z * 0.14) * 0.7;

  const dCrater = Math.hypot(x - (-38), z - 45);
  let craterHole = 0;
  if (dCrater < 24) {
    const craterNorm = dCrater / 24;
    craterHole = (Math.sin(craterNorm * Math.PI) * 2.2) - (1.0 - Math.pow(craterNorm, 2)) * 4.0;
  }

  const ridge = z < -15 ? Math.pow(Math.abs(z + 15) * 0.12, 1.35) * Math.cos(x * 0.06) * 1.8 : 0;
  const rawDisplacement = (wave1 + wave2 + detail + craterHole + ridge) * plateauFactor;

  return BASE_SURFACE_Y + rawDisplacement;
}

export function getTerrainNormal(x: number, z: number): THREE.Vector3 {
  const eps = 0.25;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  return new THREE.Vector3((hL - hR) / (2 * eps), 1.0, (hD - hU) / (2 * eps)).normalize();
}

export function getBiomeAt(x: number, z: number): {
  type: BiomeType;
  name: string;
  description: string;
  ambientColor: string;
} {
  const dOrigin = Math.hypot(x, z);
  if (dOrigin < 25) {
    return {
      type: 'COLONY_OUTPOST',
      name: 'COLONY HABITAT PERIMETER',
      description: 'Pressurized sector with atmospheric scrubbers and power grid distribution.',
      ambientColor: '#38bdf8'
    };
  }
  if (x > 15 && z > 0) {
    return {
      type: 'BIOLUMINESCENT_FOREST',
      name: 'VERDANT LUMEN BASIN',
      description: 'Dense extraterrestrial flora canopy with glowing crystalline spore blossoms.',
      ambientColor: '#34d399'
    };
  }
  if (x < -20 && z > 15) {
    return {
      type: 'ANOMALY_CRATER',
      name: 'ECHO METEOR DEPRESSION',
      description: 'Impact crater radiating low-frequency harmonic electromagnetic signals.',
      ambientColor: '#c084fc'
    };
  }
  if (z < -15) {
    return {
      type: 'ROCKY_PLATEAU',
      name: 'BASALT RIDGE ESCARPMENT',
      description: 'Wind-sheared crags rich in dense titanium and ferrous regolith deposits.',
      ambientColor: '#f97316'
    };
  }
  return {
    type: 'DUSK_PLAINS',
    name: 'AETHELIA DUSK STEPPE',
    description: 'Vast silica sand dunes exposed to perpetual twilight solar flares.',
    ambientColor: '#93c5fd'
  };
}
