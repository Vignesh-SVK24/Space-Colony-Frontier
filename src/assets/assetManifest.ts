export interface AssetEntry {
  path: string;
  type: 'model' | 'texture' | 'audio';
  fallback: 'procedural';
  license: string;
  scale?: [number, number, number];
  rotation?: [number, number, number];
  rotationCorrection?: [number, number, number];
  materialChannels?: {
    primaryHull?: string;
    secondaryHull?: string;
    cockpitGlass?: string;
    engineGlow?: string;
  };
}

export interface AssetManifest {
  version: string;
  assets: Record<string, AssetEntry>;
}

export const ASSET_MANIFEST: AssetManifest = {
  version: '1.1.0',
  assets: {
    ship_player: {
      path: 'assets/models/spaceships/spaceship_explorer.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'CC0 Universal',
      scale: [1, 1, 1]
    },
    spaceship_explorer: {
      path: 'assets/models/spaceships/spaceship_explorer.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'CC0 Universal',
      scale: [1, 1, 1],
      rotationCorrection: [0, Math.PI, 0],
      materialChannels: {
        primaryHull: 'Hull_Primary',
        secondaryHull: 'Hull_Secondary',
        cockpitGlass: 'Canopy_Glass',
        engineGlow: 'Thruster_Glow'
      }
    },
    asteroid_iron: {
      path: 'assets/models/asteroids/asteroid_iron.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'CC0 Universal',
      scale: [1, 1, 1]
    },
    ufo_scout: {
      path: 'assets/models/ufo/ufo_scout.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'CC0 Universal',
      scale: [1, 1, 1]
    }
  }
};
