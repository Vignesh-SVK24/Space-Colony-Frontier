import { create } from 'zustand';
import { ResourceId } from '../config/resourceConfig';
import { nexusAudio } from '../utils/nexusAudio';

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
  temperature: number; // ?C
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

export interface NexusAlertItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'discovery' | 'alien' | 'system';
  title: string;
  message: string;
  timestamp: string;
}

export type ModalView = 'build' | 'research' | 'map' | 'colony' | 'ship' | 'alien' | 'settings' | null;

interface NexusGameState {
  // World telemetry
  solDay: number;
  solTime: string;
  timeMultiplier: 0 | 1 | 2 | 5;
  activeCameraMode: number;

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

  // Actions
  setTimeMultiplier: (multiplier: 0 | 1 | 2 | 5) => void;
  setCameraMode: (mode: number) => void;
  openModal: (modal: ModalView) => void;
  closeModal: () => void;
  selectEntity: (entity: SelectedEntity) => void;
  clearSelection: () => void;
  setHoveredEntity: (entity: { name: string; type: string; distanceM: number; actionPrompt?: string } | null) => void;
  startScan: () => void;
  dismissAlert: (id: string) => void;
  addAlert: (alert: Omit<NexusAlertItem, 'id' | 'timestamp'>) => void;
  executeEntityAction: (actionId: string) => void;
  tickSimulation: () => void;
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

  hoveredEntity: {
    name: 'TITANIUM ASTEROID-047',
    type: 'RESOURCE NODE',
    distanceM: 420,
    actionPrompt: 'PRESS [E] TO SCAN'
  },
  scanProgress: 0,
  isScanning: false,

  activeModal: null,

  alerts: [
    {
      id: 'alt-1',
      type: 'alien',
      title: 'UNKNOWN CONTACT DETECTED',
      message: 'Unidentified craft UFO-X17 entered orbital perimeter.',
      timestamp: '14:35'
    },
    {
      id: 'alt-2',
      type: 'discovery',
      title: 'RARE TITANIUM DEPOSIT',
      message: 'Exploration scan verified deep vein at Crater Edge (Yield: 840).',
      timestamp: '14:22'
    },
    {
      id: 'alt-3',
      type: 'system',
      title: 'LIFE SUPPORT STABLE',
      message: 'Oxygen reclamation running at 99.4% efficiency.',
      timestamp: '14:00'
    }
  ],

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

    set({ resources: updatedResources });
  }
}));
