export interface AssetEntry {
  path: string;
  type: 'model' | 'texture' | 'audio';
  fallback: 'procedural';
  license: string;
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

export interface AssetManifest {
  version: string;
  assets: Record<string, AssetEntry>;
}

export const ASSET_MANIFEST: AssetManifest = {
  version: '1.0.0',
  assets: {
    ship_player: {
      path: 'assets/models/spacecraft/ship_player.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'Procedural / CC0',
      scale: [1, 1, 1]
    },
    building_habitat_dome: {
      path: 'assets/models/buildings/habitat_dome.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'Procedural / CC0',
      scale: [1, 1, 1]
    },
    building_solar_panel: {
      path: 'assets/models/buildings/solar_panel.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'Procedural / CC0',
      scale: [1, 1, 1]
    },
    building_command_center: {
      path: 'assets/models/buildings/command_center.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'Procedural / CC0',
      scale: [1, 1, 1]
    },
    ufo_scout: {
      path: 'assets/models/aliens/ufo_scout.glb',
      type: 'model',
      fallback: 'procedural',
      license: 'Procedural / CC0',
      scale: [1, 1, 1]
    }
  }
};
