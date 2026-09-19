/**
 * SPACE COLONY: FRONTIER - Centralized 3D Visual & Material Theme
 * Defines color palettes, PBR material properties, biome themes,
 * resource visuals, building aesthetics, and spaceship paint schemes.
 */

export const VISUAL_THEME = {
  space: {
    voidBlack: '#02040a',
    deepSpace: '#060a14',
    nebulaBlue: '#0c1a30',
    nebulaViolet: '#1a0c2e',
    starWhite: '#ffffff',
    starCoolBlue: '#93c5fd',
    starWarmYellow: '#fef08a'
  },

  planet: {
    atmosphereGlow: '#38bdf8',
    atmosphereDensity: 0.85,
    cloudColor: '#e0f2fe',
    biomes: {
      rocky: {
        baseColor: '#334155',
        secondaryColor: '#475569',
        roughness: 0.9,
        metalness: 0.1,
        name: 'Basalt Highland'
      },
      desert: {
        baseColor: '#b45309',
        secondaryColor: '#d97706',
        roughness: 0.95,
        metalness: 0.05,
        name: 'Silica Dunes'
      },
      frozen: {
        baseColor: '#e0f2fe',
        secondaryColor: '#7dd3fc',
        roughness: 0.3,
        metalness: 0.2,
        name: 'Glacial Permafrost'
      },
      volcanic: {
        baseColor: '#18181b',
        secondaryColor: '#450a0a',
        emissiveColor: '#ea580c',
        emissiveIntensity: 0.8,
        roughness: 0.8,
        metalness: 0.3,
        name: 'Magma Caldera'
      },
      alien: {
        baseColor: '#2e1065',
        secondaryColor: '#0f766e',
        emissiveColor: '#a855f7',
        emissiveIntensity: 0.35,
        roughness: 0.6,
        metalness: 0.4,
        name: 'Xenomorphic Flats'
      }
    },
    colonySafeZone: {
      color: '#0284c7',
      boundaryColor: '#38bdf8',
      emissiveIntensity: 0.4
    }
  },

  resources: {
    iron: {
      color: '#64748b',
      roughness: 0.5,
      metalness: 0.8,
      name: 'Iron Ore'
    },
    titanium: {
      color: '#93c5fd',
      roughness: 0.3,
      metalness: 0.9,
      emissive: '#1e3a8a',
      emissiveIntensity: 0.15,
      name: 'Titanium Shards'
    },
    silicon: {
      color: '#0284c7',
      roughness: 0.2,
      metalness: 0.6,
      emissive: '#0369a1',
      emissiveIntensity: 0.2,
      name: 'Silicon Crystals'
    },
    ice: {
      color: '#bae6fd',
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      opacity: 0.85,
      name: 'Glacial Ice'
    },
    uranium: {
      color: '#14532d',
      roughness: 0.6,
      metalness: 0.5,
      emissive: '#22c55e',
      emissiveIntensity: 0.7,
      name: 'Uranium Isotope'
    },
    rare: {
      color: '#4c1d95',
      roughness: 0.4,
      metalness: 0.7,
      emissive: '#c026d3',
      emissiveIntensity: 0.9,
      name: 'Rare Resonator Crystal'
    }
  },

  buildings: {
    command_center: {
      primaryColor: '#e2e8f0',
      secondaryColor: '#0284c7',
      accentColor: '#38bdf8',
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.25
    },
    habitat_dome: {
      primaryColor: '#f8fafc',
      glassColor: '#7dd3fc',
      accentColor: '#0ea5e9',
      glassOpacity: 0.5,
      metalness: 0.3,
      roughness: 0.15
    },
    solar_panel: {
      primaryColor: '#0f172a',
      panelColor: '#1e1b4b',
      reflectionGlow: '#6366f1',
      metalness: 0.9,
      roughness: 0.1
    },
    mining_facility: {
      primaryColor: '#334155',
      secondaryColor: '#d97706',
      accentColor: '#f59e0b',
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.7
    },
    defense_system: {
      primaryColor: '#1e293b',
      secondaryColor: '#dc2626',
      accentColor: '#ef4444',
      emissiveIntensity: 0.8,
      metalness: 0.85,
      roughness: 0.35
    }
  },

  spaceshipPaintSchemes: {
    default: {
      id: 'default',
      name: 'Frontier Standard',
      primaryHull: '#e2e8f0',
      secondaryHull: '#0284c7',
      cockpitGlass: '#0ea5e9',
      engineGlow: '#38bdf8',
      thrusterFlare: '#67e8f9',
      metalness: 0.75,
      roughness: 0.3
    },
    stealth: {
      id: 'stealth',
      name: 'Shadow Recon',
      primaryHull: '#0f172a',
      secondaryHull: '#334155',
      cockpitGlass: '#475569',
      engineGlow: '#a855f7',
      thrusterFlare: '#c084fc',
      metalness: 0.9,
      roughness: 0.4
    },
    explorer: {
      id: 'explorer',
      name: 'Deep Space Surveyor',
      primaryHull: '#ffffff',
      secondaryHull: '#ea580c',
      cockpitGlass: '#38bdf8',
      engineGlow: '#06b6d4',
      thrusterFlare: '#a5f3fc',
      metalness: 0.65,
      roughness: 0.25
    },
    mining: {
      id: 'mining',
      name: 'Heavy Industrial',
      primaryHull: '#eab308',
      secondaryHull: '#1e293b',
      cockpitGlass: '#f59e0b',
      engineGlow: '#f97316',
      thrusterFlare: '#fdba74',
      metalness: 0.6,
      roughness: 0.6
    },
    command: {
      id: 'command',
      name: 'Fleet Admiral',
      primaryHull: '#09090b',
      secondaryHull: '#e2e8f0',
      cockpitGlass: '#38bdf8',
      engineGlow: '#3b82f6',
      thrusterFlare: '#93c5fd',
      metalness: 0.85,
      roughness: 0.2
    }
  }
} as const;

export type SpaceshipPaintSchemeKey = keyof typeof VISUAL_THEME.spaceshipPaintSchemes;
export type PlanetBiomeKey = keyof typeof VISUAL_THEME.planet.biomes;
export type ResourceVisualKey = keyof typeof VISUAL_THEME.resources;
