import { create } from 'zustand';
import { ResourceId } from '../config/resourceConfig';
import { nexusAudio } from '../utils/nexusAudio';
import { GraphicsSettings, QualityPreset, GRAPHICS_PRESETS, getDefaultGraphicsSettings } from '../config/graphicsConfig';

export interface ResourceTelemetry {
  id: ResourceId;
  name: string;
  current: number;
  capacity: number;
  ratePerMinute: number;
  status: 'healthy' | 'warning' | 'critical';
  color: string;
}

export interface ColonyVitals {
  population: number;
  maxPopulation: number;
  health: number; // 0-100
  morale: number; // 0-100
  security: number; // 0-100
  temperature: number; // °C
  overallStatus: 'OPTIMAL' | 'STABLE' | 'WARNING' | 'CRITICAL';
}

export interface MissionObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface NexusMission {
  id: string; // e.g. "NX-042"
  title: string;
  description: string;
  objectives: MissionObjective[];
  progress: number; // 0-100
  reward: string;
  status: 'active' | 'completed' | 'locked';
}

export type SelectedEntityType = 'asteroid' | 'building' | 'spacecraft' | 'ufo' | 'none';

export interface SelectedEntity {
  id: string;
  name: string;
  type: SelectedEntityType;
  status: string;
  distanceKm?: number;
  metrics: { label: string; value: string | number; unit?: string }[];
  actions: { id: string; label: string; variant?: 'primary' | 'secondary' | 'danger' }[];
}

export type SpaceWeatherType = 'CALM' | 'SOLAR_STORM' | 'METEOR_SHOWER' | 'RADIATION_WAVE' | 'UNKNOWN_SIGNAL';
export type MapScaleLevel = 'surface' | 'orbit' | 'system' | 'deep_space';

export interface RadarContact {
  id: string;
  name: string;
  type: 'ship' | 'station' | 'satellite' | 'asteroid' | 'ufo' | 'landmark';
  faction: 'colony' | 'civilian' | 'mining' | 'alien' | 'neutral';
  pos: [number, number, number];
  distanceKm: number;
  status: string;
}

export interface SatelliteNetworkVitals {
  commsCoverage: number; // 0-100%
  navAccuracy: number;   // 0-100%
  activeSatellites: number;
  totalSatellites: number;
}

export interface NexusAlertItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'discovery' | 'alien' | 'system';
  title: string;
  message: string;
  timestamp: string;
}

export type ModalView = 'build' | 'research' | 'map' | 'colony' | 'ship' | 'alien' | 'settings' | 'graphics' | null;

export type GameMode =
  | 'SPACE_FLIGHT'
  | 'ORBIT'
  | 'DESCENDING'
  | 'LANDING'
  | 'LANDED'
  | 'LANDING_TRANSITION'
  | 'ASTRONAUT'
  | 'ENTERING_SHIP'
  | 'TAKEOFF_PREP'
  | 'TAKEOFF'
  | 'ASCENDING'
  | 'SPACE_RETURN';

export type BiomeType =
  | 'COLONY_OUTPOST'
  | 'ROCKY_PLATEAU'
  | 'BIOLUMINESCENT_FOREST'
  | 'DUSK_PLAINS'
  | 'ANOMALY_CRATER';

export interface PlanetaryPOI {
  id: string;
  name: string;
  type: 'outpost' | 'terminal' | 'monolith' | 'mineral' | 'drone' | 'oxygen_station';
  position: [number, number, number];
  description: string;
  discovered: boolean;
  interacted: boolean;
  rewardText?: string;
}

export interface ScannedTargetData {
  name: string;
  classification: string;
  distanceM: number;
  composition: string;
  spectralSignature: string;
  radiationLevel: string;
  purity: string;
}

export interface ActiveWaypoint {
  id: string;
  name: string;
  position: [number, number, number];
  type: string;
}

export interface WaypointDistance {
  horizontal: number;
  vertical: number;
  total: number;
}

interface NexusGameState {
  // World telemetry
  solDay: number;
  solTime: string;
  timeMultiplier: 0 | 1 | 2 | 5;
  activeCameraMode: number;

  // Game Mode State Machine
  gameMode: GameMode;
  landingProgress: number; // 0-1 during descent
  takeoffProgress: number; // 0-1 during liftoff
  transitionProgress: number; // 0-1 during fade transition
  transitionMessage: string;

  // Human Astronaut Telemetry
  suitOxygen: number; // 0-100
  suitEnergy: number; // 0-100
  suitCondition: number; // 0-100
  astronautPosition: [number, number, number];
  astronautHeading: number;
  astronautAnimationState: 'IDLE' | 'WALK' | 'RUN' | 'SCAN' | 'INTERACT' | 'BOARD';
  astronautScannerActive: boolean;
  activeBiome: BiomeType;
  scannedTarget: ScannedTargetData | null;
  planetaryPOIs: PlanetaryPOI[];
  landedShipPosition: [number, number, number];
  isDebugOpen: boolean;

  // Resources
  resources: Record<ResourceId, ResourceTelemetry>;

  // Colony vitals
  colonyVitals: ColonyVitals;

  // Missions
  missions: NexusMission[];
  activeMissionId: string;

  // Selection & 3D targeting
  selectedEntity: SelectedEntity;
  hoveredEntity: { name: string; type: string; distanceM: number; actionPrompt?: string } | null;
  scanProgress: number; // 0-100
  isScanning: boolean;

  // Modals & Navigation
  activeModal: ModalView;

  // Alerts
  alerts: NexusAlertItem[];

  // Gaming HUD visibility & flight telemetry
  hudVisible: boolean;
  flightSpeed: number;
  verticalSpeed: number; // m/s
  altitude: number; // m or km above surface
  heading: number; // 0-360 deg
  pitch: number; // -90 to +90 deg
  roll: number; // -180 to +180 deg
  flightAssist: boolean;
  flightWarnings: string[];
  isBoosting: boolean;
  isBraking: boolean;

  // Active 3D Waypoint System
  activeWaypoint: ActiveWaypoint | null;
  distanceToWaypoint: WaypointDistance | null;

  // Celestial & Large-Scale Space Telemetry
  shipPosition: [number, number, number];
  solarCycleAngle: number;
  moonAngle: number;
  weatherEvent: SpaceWeatherType;
  satelliteNetwork: SatelliteNetworkVitals;
  radarContacts: RadarContact[];
  mapScale: MapScaleLevel;
  discoveredLocations: string[];

  // Actions
  setGameMode: (mode: GameMode) => void;
  setWaypoint: (waypoint: ActiveWaypoint | null) => void;
  clearWaypoint: () => void;
  toggleFlightAssist: () => void;
  setFlight3DTelemetry: (data: {
    speed: number;
    verticalSpeed: number;
    altitude: number;
    heading: number;
    pitch: number;
    roll: number;
    isBoosting: boolean;
    isBraking: boolean;
    warnings: string[];
  }) => void;
  initiateLandingSequence: () => void;
  completeTouchdown: () => void;
  finishLandingTransition: () => void;
  enterAstronautMode: () => void;
  boardShip: () => void;
  initiateTakeoffSequence: () => void;
  finishTakeoff: () => void;
  setAstronautTelemetry: (
    pos: [number, number, number],
    heading: number,
    anim: 'IDLE' | 'WALK' | 'RUN' | 'SCAN' | 'INTERACT' | 'BOARD'
  ) => void;
  toggleAstronautScanner: () => void;
  setScannedTarget: (target: ScannedTargetData | null) => void;
  consumeOxygen: (amount: number) => void;
  refillSuitVitals: () => void;
  interactWithPOI: (poiId: string) => void;
  toggleDebugPanel: () => void;
  teleportTo: (pos: [number, number, number]) => void;

  setTimeMultiplier: (multiplier: 0 | 1 | 2 | 5) => void;
  setCameraMode: (mode: number) => void;
  openModal: (modal: ModalView) => void;
  closeModal: () => void;
  toggleHud: () => void;
  setFlightTelemetry: (telemetry: { speed: number; isBoosting: boolean; isBraking: boolean }) => void;
  setShipPosition: (pos: [number, number, number]) => void;
  triggerWeatherEvent: (weather: SpaceWeatherType) => void;
  setMapScale: (scale: MapScaleLevel) => void;
  recordDiscovery: (id: string, name: string) => void;
  updateRadarContacts: (contacts: RadarContact[]) => void;
  selectEntity: (entity: SelectedEntity) => void;
  clearSelection: () => void;
  setHoveredEntity: (entity: { name: string; type: string; distanceM: number; actionPrompt?: string } | null) => void;
  startScan: () => void;
  dismissAlert: (id: string) => void;
  addAlert: (alert: Omit<NexusAlertItem, 'id' | 'timestamp'>) => void;
  executeEntityAction: (actionId: string) => void;
  tickSimulation: () => void;

  // Graphics Pipeline Settings
  graphicsSettings: GraphicsSettings;
  setGraphicsQuality: (preset: QualityPreset) => void;
  updateGraphicsSettings: (partial: Partial<GraphicsSettings>) => void;
  toggleGraphicsDebug: () => void;
  toggleWireframe: () => void;
}

export const useNexusGameStore = create<NexusGameState>((set, get) => ({
  solDay: 34,
  solTime: '14:38',
  timeMultiplier: 1,
  activeCameraMode: 1,

  resources: {
    oxygen: { id: 'oxygen', name: 'Oxygen', current: 412, capacity: 500, ratePerMinute: 8.4, status: 'healthy', color: '#38bdf8' },
    water: { id: 'water', name: 'Water', current: 380, capacity: 500, ratePerMinute: 5.2, status: 'healthy', color: '#60a5fa' },
    food: { id: 'food', name: 'Food', current: 290, capacity: 500, ratePerMinute: 3.1, status: 'healthy', color: '#4ade80' },
    energy: { id: 'energy', name: 'Energy', current: 740, capacity: 1000, ratePerMinute: 12.0, status: 'healthy', color: '#facc15' },
    iron: { id: 'iron', name: 'Iron', current: 620, capacity: 1000, ratePerMinute: 14.5, status: 'healthy', color: '#94a3b8' },
    titanium: { id: 'titanium', name: 'Titanium', current: 210, capacity: 500, ratePerMinute: 2.8, status: 'healthy', color: '#c084fc' },
    silicon: { id: 'silicon', name: 'Silicon', current: 340, capacity: 600, ratePerMinute: 4.1, status: 'healthy', color: '#2dd4bf' },
    ice: { id: 'ice', name: 'Ice', current: 490, capacity: 800, ratePerMinute: 6.0, status: 'healthy', color: '#a5f3fc' },
    rare: { id: 'rare', name: 'Rare Minerals', current: 85, capacity: 300, ratePerMinute: 1.2, status: 'warning', color: '#f43f5e' },
    fuel: { id: 'fuel', name: 'Rocket Fuel', current: 420, capacity: 600, ratePerMinute: 2.0, status: 'healthy', color: '#fb923c' },
    research: { id: 'research', name: 'Research Points', current: 840, capacity: 999999, ratePerMinute: 8.0, status: 'healthy', color: '#a855f7' },
    credits: { id: 'credits', name: 'Credits', current: 12450, capacity: 9999999, ratePerMinute: 25.0, status: 'healthy', color: '#eab308' }
  },

  colonyVitals: {
    population: 18,
    maxPopulation: 30,
    health: 96,
    morale: 88,
    security: 92,
    temperature: -14,
    overallStatus: 'OPTIMAL'
  },

  missions: [
    {
      id: 'NX-042',
      title: 'UNKNOWN SIGNAL',
      description: 'Investigate the anomalous transmission detected at Northern Crater Sector 7.',
      objectives: [
        { id: '1', text: 'Deploy long-range sensor beacon', completed: true },
        { id: '2', text: 'Scan signal resonance frequency', completed: true },
        { id: '3', text: 'Reach signal origin coordinates', completed: false }
      ],
      progress: 68,
      reward: '+1,200 Credits ? +400 Research ? Artifact Fragment',
      status: 'active'
    },
    {
      id: 'NX-114',
      title: 'FIRST HABITAT EXPANSION',
      description: 'Construct Habitat Dome Theta and balance life-support consumption.',
      objectives: [
        { id: '1', text: 'Place Habitat Dome structure', completed: true },
        { id: '2', text: 'Supply continuous 4.0 kW power', completed: true }
      ],
      progress: 100,
      reward: '+600 Credits ? +6 Colony Capacity',
      status: 'completed'
    },
    {
      id: 'NX-008',
      title: 'PERMAFROST MINING NETWORK',
      description: 'Establish automated ice extractors to secure water feedstock reserves.',
      objectives: [
        { id: '1', text: 'Extract 500 units of glacial ice', completed: false },
        { id: '2', text: 'Connect ice route to Oxygen Electrolyzer', completed: false }
      ],
      progress: 42,
      reward: '+800 Credits ? +150 Water',
      status: 'active'
    }
  ],
  activeMissionId: 'NX-042',

  selectedEntity: {
    id: 'beacon-01',
    name: 'QUANTUM CORE BEACON',
    type: 'building',
    status: 'OPERATIONAL',
    metrics: [
      { label: 'OUTPUT', value: '1.21', unit: 'GW' },
      { label: 'STATUS', value: 'SYNCHRONIZED' },
      { label: 'INTEGRITY', value: '100', unit: '%' },
      { label: 'GRID LOAD', value: '42', unit: 'kW' }
    ],
    actions: [
      { id: 'boost', label: 'OVERCHARGE BEACON', variant: 'primary' },
      { id: 'diagnostics', label: 'RUN TELEMETRY', variant: 'secondary' },
      { id: 'inspect', label: 'INSPECT MATRIX', variant: 'secondary' }
    ]
  },

  hoveredEntity: null,
  scanProgress: 0,
  isScanning: false,

  activeModal: null,

  // Game Mode State Machine
  gameMode: 'SPACE_FLIGHT',
  landingProgress: 0,
  takeoffProgress: 0,
  transitionProgress: 0,
  transitionMessage: '',

  // Human Astronaut Telemetry
  suitOxygen: 100,
  suitEnergy: 100,
  suitCondition: 100,
  astronautPosition: [2, -1.3, 3],
  astronautHeading: 0,
  astronautAnimationState: 'IDLE',
  astronautScannerActive: false,
  activeBiome: 'COLONY_OUTPOST',
  scannedTarget: null,
  landedShipPosition: [0, -1.4, 0],
  isDebugOpen: false,

  planetaryPOIs: [
    {
      id: 'poi-terminal',
      name: 'RESEARCH TERMINAL BRAVO',
      type: 'terminal',
      position: [18, -1.2, 14],
      description: 'Automated planetary survey station. High-speed uplink to Apex Station orbital archive.',
      discovered: false,
      interacted: false,
      rewardText: '+300 Research Points'
    },
    {
      id: 'poi-monolith',
      name: 'ANOMALY MONOLITH ECHO',
      type: 'monolith',
      position: [-38, 2.5, 45],
      description: 'Extraterrestrial crystalline obelisk emitting low-frequency harmonic resonance.',
      discovered: false,
      interacted: false,
      rewardText: '+1 Artifact Relic Fragment ? +500 XP'
    },
    {
      id: 'poi-mineral',
      name: 'TITANIUM CRUST MATRIX',
      type: 'mineral',
      position: [42, 1.8, -32],
      description: 'High-purity igneous titanium-cobalt deposit ready for pneumatic extraction.',
      discovered: false,
      interacted: false,
      rewardText: '+120 Titanium ? +40 Rare Minerals'
    },
    {
      id: 'poi-oxygen',
      name: 'ATMOSPHERIC SCRUBBER STATION',
      type: 'oxygen_station',
      position: [-14, -1.3, -12],
      description: 'Cryogenic O2 compression station. Automatically pressurizes astronaut suit tanks.',
      discovered: true,
      interacted: false,
      rewardText: 'Full Suit Oxygen Refill'
    },
    {
      id: 'poi-drone',
      name: 'CRASHED RECON PROBE DELTA',
      type: 'drone',
      position: [-50, 3.8, -46],
      description: 'Deep-space telemetry probe crashed during entry sol 18. Avionics core intact.',
      discovered: false,
      interacted: false,
      rewardText: '+240 Silicon ? +80 Electronics'
    }
  ],

  alerts: [],

  hudVisible: true,
  flightSpeed: 0,
  verticalSpeed: 0,
  altitude: 10.5,
  heading: 0,
  pitch: 0,
  roll: 0,
  flightAssist: true,
  flightWarnings: [],
  isBoosting: false,
  isBraking: false,

  activeWaypoint: null,
  distanceToWaypoint: null,

  shipPosition: [0, 8, 14],
  solarCycleAngle: 0.85,
  moonAngle: 0.35,
  weatherEvent: 'CALM',
  satelliteNetwork: {
    commsCoverage: 98.4,
    navAccuracy: 99.2,
    activeSatellites: 6,
    totalSatellites: 6
  },
  radarContacts: [],
  mapScale: 'orbit',
  discoveredLocations: ['colony-alpha', 'selene-prime', 'apex-station'],
  graphicsSettings: getDefaultGraphicsSettings(),

  setWaypoint: (waypoint) => {
    if (waypoint) {
      nexusAudio.playConfirm();
      const { shipPosition, astronautPosition, gameMode, addAlert } = get();
      const currentPos = gameMode === 'ASTRONAUT' ? astronautPosition : shipPosition;
      const dx = waypoint.position[0] - currentPos[0];
      const dy = waypoint.position[1] - currentPos[1];
      const dz = waypoint.position[2] - currentPos[2];
      const horiz = Math.hypot(dx, dz);
      const total = Math.sqrt(dx * dx + dy * dy + dz * dz);
      set({
        activeWaypoint: waypoint,
        distanceToWaypoint: { horizontal: horiz, vertical: dy, total }
      });
      addAlert({
        type: 'info',
        title: 'WAYPOINT LOCKED: ' + waypoint.name,
        message: `Bearing locked. Vector distance: ${total >= 10 ? (total * 0.1).toFixed(1) + ' KM' : Math.round(total * 10) + ' M'}.`
      });
    } else {
      set({ activeWaypoint: null, distanceToWaypoint: null });
    }
  },

  clearWaypoint: () => set({ activeWaypoint: null, distanceToWaypoint: null }),

  toggleFlightAssist: () => {
    nexusAudio.playClick(1100);
    set((state) => ({ flightAssist: !state.flightAssist }));
  },

  setFlight3DTelemetry: (data) => {
    const { activeWaypoint, shipPosition } = get();
    let distanceToWaypoint = get().distanceToWaypoint;
    if (activeWaypoint) {
      const dx = activeWaypoint.position[0] - shipPosition[0];
      const dy = activeWaypoint.position[1] - shipPosition[1];
      const dz = activeWaypoint.position[2] - shipPosition[2];
      distanceToWaypoint = {
        horizontal: Math.hypot(dx, dz),
        vertical: dy,
        total: Math.sqrt(dx * dx + dy * dy + dz * dz)
      };
    }
    set({
      flightSpeed: Math.round(data.speed),
      verticalSpeed: Math.round(data.verticalSpeed * 10) / 10,
      altitude: Math.round(data.altitude * 10) / 10,
      heading: Math.round(data.heading),
      pitch: Math.round(data.pitch),
      roll: Math.round(data.roll),
      isBoosting: data.isBoosting,
      isBraking: data.isBraking,
      flightWarnings: data.warnings,
      distanceToWaypoint
    });
  },

  setGameMode: (mode) => set({ gameMode: mode }),

  initiateLandingSequence: () => {
    nexusAudio.playWarning();
    set({
      gameMode: 'DESCENDING',
      landingProgress: 0.1
    });
    get().addAlert({
      type: 'system',
      title: 'DESCENT TRAJECTORY LOCKED',
      message: 'Retro-thrusters engaged. Automated atmospheric landing guidance initialized.'
    });
  },

  completeTouchdown: () => {
    nexusAudio.playConfirm();
    const shipPos = get().shipPosition;
    set({
      gameMode: 'LANDING_TRANSITION',
      landingProgress: 1,
      landedShipPosition: [shipPos[0], -1.4, shipPos[2]],
      transitionProgress: 0,
      transitionMessage: 'AETHELIA-IV TOUCHDOWN CONFIRMED // DEPLOYING EVA ASTRONAUT SUIT'
    });
  },

  finishLandingTransition: () => {
    const landedPos = get().landedShipPosition;
    set({
      gameMode: 'ASTRONAUT',
      astronautPosition: [landedPos[0] + 2.5, -1.3, landedPos[2] + 2.5],
      transitionProgress: 1,
      transitionMessage: ''
    });
    nexusAudio.playDiscovery();
    get().addAlert({
      type: 'info',
      title: 'EVA SUIT ACTIVE',
      message: 'Ground exploration authorized. Monitor suit oxygen levels outside the colony perimeter.'
    });
  },

  enterAstronautMode: () => {
    const shipPos = get().shipPosition;
    set({
      gameMode: 'ASTRONAUT',
      landedShipPosition: [shipPos[0], -1.4, shipPos[2]],
      astronautPosition: [shipPos[0] + 2.5, -1.3, shipPos[2] + 2.5]
    });
  },

  boardShip: () => {
    nexusAudio.playConfirm();
    set({
      gameMode: 'ENTERING_SHIP',
      transitionProgress: 0,
      transitionMessage: 'BOARDING CRAFT // INITIALIZING COCKPIT AVIONICS...'
    });
    setTimeout(() => {
      set({
        gameMode: 'TAKEOFF_PREP',
        transitionProgress: 1,
        transitionMessage: ''
      });
      get().initiateTakeoffSequence();
    }, 1200);
  },

  initiateTakeoffSequence: () => {
    nexusAudio.playConfirm();
    set({
      gameMode: 'TAKEOFF',
      takeoffProgress: 0.1
    });
    get().addAlert({
      type: 'system',
      title: 'VTOL ASCENT ENGAGED',
      message: 'Primary thrusters firing at 100%. Breaking planetary gravity well.'
    });
  },

  finishTakeoff: () => {
    nexusAudio.playDiscovery();
    set({
      gameMode: 'SPACE_FLIGHT',
      takeoffProgress: 1,
      shipPosition: [0, 15, 12]
    });
    get().addAlert({
      type: 'info',
      title: 'ORBITAL INSERTION COMPLETE',
      message: 'Atmospheric envelope cleared. 6-DOF orbital flight restored.'
    });
  },

  setAstronautTelemetry: (pos, heading, anim) => {
    // Biome evaluation by distance & quadrants
    const dOrigin = Math.hypot(pos[0], pos[2]);
    let biome: BiomeType = 'COLONY_OUTPOST';
    if (dOrigin < 25) {
      biome = 'COLONY_OUTPOST';
    } else if (pos[0] > 15 && pos[2] > 0) {
      biome = 'BIOLUMINESCENT_FOREST';
    } else if (pos[0] < -20 && pos[2] > 15) {
      biome = 'ANOMALY_CRATER';
    } else if (pos[2] < -15) {
      biome = 'ROCKY_PLATEAU';
    } else {
      biome = 'DUSK_PLAINS';
    }

    set({
      astronautPosition: pos,
      astronautHeading: heading,
      astronautAnimationState: anim,
      activeBiome: biome
    });
  },

  toggleAstronautScanner: () => {
    const current = get().astronautScannerActive;
    if (!current) {
      nexusAudio.playScan();
    } else {
      nexusAudio.playClick(900);
    }
    set({ astronautScannerActive: !current });
  },

  setScannedTarget: (target) => set({ scannedTarget: target }),

  consumeOxygen: (amount) => {
    const { suitOxygen, addAlert } = get();
    const newO2 = Math.max(0, suitOxygen - amount);
    if (suitOxygen > 20 && newO2 <= 20) {
      nexusAudio.playWarning();
      addAlert({
        type: 'critical',
        title: 'CRITICAL OXYGEN WARNING',
        message: 'Suit life-support at 20%! Return to spacecraft or oxygen station immediately.'
      });
    } else if (suitOxygen > 40 && newO2 <= 40) {
      addAlert({
        type: 'warning',
        title: 'OXYGEN CAUTION',
        message: 'Suit oxygen below 40%. Plan return trajectory.'
      });
    }
    set({ suitOxygen: newO2 });
  },

  refillSuitVitals: () => {
    const { suitOxygen } = get();
    if (suitOxygen < 98) {
      nexusAudio.playConfirm();
      get().addAlert({
        type: 'success',
        title: 'SUIT TANKS REPLENISHED',
        message: 'Oxygen scrubber pressurized to 100% capacity.'
      });
    }
    set({ suitOxygen: 100, suitEnergy: 100, suitCondition: 100 });
  },

  interactWithPOI: (poiId) => {
    const { planetaryPOIs, resources, addAlert } = get();
    const poiIndex = planetaryPOIs.findIndex((p) => p.id === poiId);
    if (poiIndex === -1) return;

    const poi = planetaryPOIs[poiIndex];
    nexusAudio.playConfirm();

    if (poi.type === 'oxygen_station') {
      get().refillSuitVitals();
      return;
    }

    if (poi.interacted) {
      addAlert({
        type: 'info',
        title: `${poi.name} ALREADY ACCESSED`,
        message: 'Telemetry databank previously synchronized.'
      });
      return;
    }

    // Mark interacted and grant rewards
    const updatedPOIs = [...planetaryPOIs];
    updatedPOIs[poiIndex] = { ...poi, interacted: true, discovered: true };

    const updatedResources = { ...resources };
    if (poi.type === 'terminal') {
      updatedResources.research.current += 300;
    } else if (poi.type === 'mineral') {
      updatedResources.titanium.current = Math.min(updatedResources.titanium.capacity, updatedResources.titanium.current + 120);
      updatedResources.rare.current = Math.min(updatedResources.rare.capacity, updatedResources.rare.current + 40);
    } else if (poi.type === 'drone') {
      updatedResources.silicon.current = Math.min(updatedResources.silicon.capacity, updatedResources.silicon.current + 240);
      updatedResources.credits.current += 500;
    } else if (poi.type === 'monolith') {
      updatedResources.research.current += 500;
      updatedResources.credits.current += 1000;
    }

    set({
      planetaryPOIs: updatedPOIs,
      resources: updatedResources
    });

    addAlert({
      type: poi.type === 'monolith' ? 'alien' : 'discovery',
      title: `OBJECTIVE ACCESSED: ${poi.name}`,
      message: `${poi.description} Reward claimed: ${poi.rewardText || 'Archived'}.`
    });
  },

  toggleDebugPanel: () => set((state) => ({ isDebugOpen: !state.isDebugOpen })),

  teleportTo: (pos) => {
    nexusAudio.playConfirm();
    if (get().gameMode === 'ASTRONAUT') {
      set({ astronautPosition: pos });
    } else {
      set({ shipPosition: pos });
    }
  },

  setTimeMultiplier: (multiplier) => {
    nexusAudio.playConfirm();
    set({ timeMultiplier: multiplier });
  },

  setCameraMode: (mode) => {
    nexusAudio.playClick(1100);
    set({ activeCameraMode: mode });
  },

  openModal: (modal) => {
    nexusAudio.playClick(1400);
    set({ activeModal: modal });
  },

  closeModal: () => {
    nexusAudio.playClick(900);
    set({ activeModal: null });
  },

  toggleHud: () => {
    nexusAudio.playClick(1200);
    set((state) => ({ hudVisible: !state.hudVisible }));
  },

  setFlightTelemetry: (telemetry) => {
    set({
      flightSpeed: Math.round(telemetry.speed),
      isBoosting: telemetry.isBoosting,
      isBraking: telemetry.isBraking
    });
  },

  setShipPosition: (pos) => set({ shipPosition: pos }),

  triggerWeatherEvent: (weather) => {
    nexusAudio.playWarning();
    set({ weatherEvent: weather });
    get().addAlert({
      type: weather === 'CALM' ? 'info' : 'warning',
      title: 'SPACE WEATHER ADVISORY',
      message: `Atmospheric and celestial sensor network reports: ${weather.replace(/_/g, ' ')}.`
    });
  },

  setMapScale: (scale) => {
    nexusAudio.playClick(1000);
    set({ mapScale: scale });
  },

  recordDiscovery: (id, name) => {
    const { discoveredLocations, addAlert } = get();
    if (!discoveredLocations.includes(id)) {
      nexusAudio.playDiscovery();
      set({ discoveredLocations: [...discoveredLocations, id] });
      addAlert({
        type: 'discovery',
        title: 'NEW SECTOR DISCOVERY',
        message: `Astronomical sensors registered uncharted target: ${name}. Synchronized to database.`
      });
    }
  },

  updateRadarContacts: (contacts) => set({ radarContacts: contacts }),

  selectEntity: (entity) => {
    nexusAudio.playConfirm();
    set({ selectedEntity: entity });
  },

  clearSelection: () => {
    set({
      selectedEntity: {
        id: 'none',
        name: 'NO TARGET SELECTED',
        type: 'none',
        status: 'STANDBY',
        metrics: [],
        actions: []
      }
    });
  },

  setHoveredEntity: (entity) => {
    set({ hoveredEntity: entity });
  },

  startScan: () => {
    const { isScanning } = get();
    if (isScanning) return;

    nexusAudio.playScan();
    set({ isScanning: true, scanProgress: 0 });

    const interval = setInterval(() => {
      const current = get().scanProgress;
      if (current >= 100) {
        clearInterval(interval);
        nexusAudio.playDiscovery();
        set({
          isScanning: false,
          scanProgress: 100,
          alerts: [
            {
              id: 'scan-' + Date.now(),
              type: 'discovery',
              title: 'SPECTRAL SCAN COMPLETE',
              message: 'Full mineral breakdown compiled. High titanium signature confirmed.',
              timestamp: 'NOW'
            },
            ...get().alerts.slice(0, 4)
          ]
        });
      } else {
        set({ scanProgress: current + 25 });
      }
    }, 200);
  },

  dismissAlert: (id) => {
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
  },

  addAlert: (alert) => {
    if (alert.type === 'alien') nexusAudio.playDiscovery();
    else if (alert.type === 'critical' || alert.type === 'warning') nexusAudio.playWarning();
    else nexusAudio.playConfirm();

    const newAlert: NexusAlertItem = {
      ...alert,
      id: 'alt-' + Date.now(),
      timestamp: 'NOW'
    };
    set((state) => ({ alerts: [newAlert, ...state.alerts.slice(0, 4)] }));
  },

  executeEntityAction: (actionId) => {
    const { selectedEntity } = get();
    nexusAudio.playConfirm();

    if (actionId === 'boost') {
      get().addAlert({
        type: 'system',
        title: 'CORE OVERCHARGE ENGAGED',
        message: 'Telemetry output boosted by +20% for 60 seconds.'
      });
    } else if (actionId === 'scan' || actionId === 'mine') {
      get().startScan();
    } else {
      get().addAlert({
        type: 'info',
        title: `COMMAND EXECUTED: ${actionId.toUpperCase()}`,
        message: `Operation initiated on ${selectedEntity.name}.`
      });
    }
  },

  tickSimulation: () => {
    const state = get();
    if (state.timeMultiplier === 0) return;

    // Advance clock slightly and update resources
    const updatedResources = { ...state.resources };
    updatedResources.energy.current = Math.min(updatedResources.energy.capacity, updatedResources.energy.current + 0.2);
    updatedResources.oxygen.current = Math.min(updatedResources.oxygen.capacity, updatedResources.oxygen.current + 0.1);

    const newSolarAngle = (state.solarCycleAngle + 0.0005 * state.timeMultiplier) % (Math.PI * 2);
    const newMoonAngle = (state.moonAngle + 0.0002 * state.timeMultiplier) % (Math.PI * 2);

    // Astronaut Mode Suit Vitals
    if (state.gameMode === 'ASTRONAUT') {
      const astroPos = state.astronautPosition;
      const shipPos = state.landedShipPosition;
      const distFromShip = Math.hypot(astroPos[0] - shipPos[0], astroPos[2] - shipPos[2]);
      const distFromColony = Math.hypot(astroPos[0], astroPos[2]);

      // Check proximity to oxygen station at [-14, -1.3, -12]
      const distFromO2Station = Math.hypot(astroPos[0] - (-14), astroPos[2] - (-12));

      if (distFromShip < 8 || distFromO2Station < 8) {
        // Safe recharge zone: replenish oxygen
        if (state.suitOxygen < 100) {
          set({ suitOxygen: Math.min(100, state.suitOxygen + 2.0 * state.timeMultiplier) });
        }
      } else if (distFromColony > 30) {
        // Harsh wilderness: consume oxygen
        get().consumeOxygen(0.2 * state.timeMultiplier);
      }
    }

    set({
      resources: updatedResources,
      solarCycleAngle: newSolarAngle,
      moonAngle: newMoonAngle
    });
  },

  setGraphicsQuality: (preset) =>
    set((s) => ({
      graphicsSettings: {
        ...GRAPHICS_PRESETS[preset],
        debugMode: s.graphicsSettings.debugMode,
        wireframe: s.graphicsSettings.wireframe
      }
    })),

  updateGraphicsSettings: (partial) =>
    set((s) => ({
      graphicsSettings: { ...s.graphicsSettings, ...partial }
    })),

  toggleGraphicsDebug: () =>
    set((s) => ({
      graphicsSettings: {
        ...s.graphicsSettings,
        debugMode: !s.graphicsSettings.debugMode
      }
    })),

  toggleWireframe: () =>
    set((s) => ({
      graphicsSettings: {
        ...s.graphicsSettings,
        wireframe: !s.graphicsSettings.wireframe
      }
    }))
}));
