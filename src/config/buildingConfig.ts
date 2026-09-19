import { ResourceId } from './resourceConfig';

export type BuildingType =
  | 'landing_pad'
  | 'habitat_dome'
  | 'oxygen_generator'
  | 'water_extractor'
  | 'food_greenhouse'
  | 'solar_panel'
  | 'battery_storage'
  | 'mining_facility'
  | 'resource_storage'
  | 'research_laboratory'
  | 'communication_tower'
  | 'medical_center'
  | 'command_center'
  | 'robotics_facility'
  | 'defense_system'
  | 'spacecraft_hangar';

export interface BuildingDef {
  type: BuildingType;
  name: string;
  category: 'life_support' | 'power' | 'industry' | 'science' | 'military' | 'infrastructure';
  cost: Partial<Record<ResourceId, number>>;
  buildTimeHours: number;
  powerUse: number; // positive = consumes, negative = produces
  production?: Partial<Record<ResourceId, number>>; // per hour
  consumption?: Partial<Record<ResourceId, number>>; // per hour
  storageBonus?: Partial<Record<ResourceId, number>>;
  maxLevel: number;
  maxHealth: number;
  workerCapacity: number;
  footprintRadius: number;
  description: string;
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> = {
  landing_pad: {
    type: 'landing_pad',
    name: 'Landing Pad',
    category: 'infrastructure',
    cost: { iron: 30 },
    buildTimeHours: 2,
    powerUse: 0,
    maxLevel: 3,
    maxHealth: 500,
    workerCapacity: 0,
    footprintRadius: 8,
    description: 'Servicing point for spacecraft arrivals, refueling, and colonist transports.'
  },
  habitat_dome: {
    type: 'habitat_dome',
    name: 'Habitat Dome',
    category: 'life_support',
    cost: { iron: 80, silicon: 40 },
    buildTimeHours: 4,
    powerUse: 2,
    maxLevel: 3,
    maxHealth: 600,
    workerCapacity: 0,
    footprintRadius: 6,
    description: 'Pressurized geodesic biodome providing housing for up to 6 colonists and morale.'
  },
  oxygen_generator: {
    type: 'oxygen_generator',
    name: 'Oxygen Generator',
    category: 'life_support',
    cost: { iron: 60, silicon: 30 },
    buildTimeHours: 3,
    powerUse: 4,
    consumption: { water: 1.5 },
    production: { oxygen: 6 },
    maxLevel: 3,
    maxHealth: 450,
    workerCapacity: 2,
    footprintRadius: 4,
    description: 'Electrolytic life-support module converting water and power into breathable O2.'
  },
  water_extractor: {
    type: 'water_extractor',
    name: 'Water Extractor',
    category: 'life_support',
    cost: { iron: 50, ice: 20 },
    buildTimeHours: 3,
    powerUse: 3,
    consumption: { ice: 2 },
    production: { water: 5 },
    maxLevel: 3,
    maxHealth: 400,
    workerCapacity: 2,
    footprintRadius: 4,
    description: 'Subsurface thermal drill extracting potable water from permafrost and ice pockets.'
  },
  food_greenhouse: {
    type: 'food_greenhouse',
    name: 'Hydroponic Greenhouse',
    category: 'life_support',
    cost: { iron: 60, silicon: 60 },
    buildTimeHours: 4,
    powerUse: 3,
    consumption: { water: 1.2 },
    production: { food: 4 },
    maxLevel: 3,
    maxHealth: 350,
    workerCapacity: 3,
    footprintRadius: 5,
    description: 'Automated aeroponic farming bays cultivating nutrient-dense rations.'
  },
  solar_panel: {
    type: 'solar_panel',
    name: 'Solar Panel Array',
    category: 'power',
    cost: { silicon: 40, iron: 20 },
    buildTimeHours: 2,
    powerUse: -8, // Net power generation during peak daylight
    maxLevel: 3,
    maxHealth: 300,
    workerCapacity: 0,
    footprintRadius: 4,
    description: 'Photovoltaic tracking array capturing stellar radiation for the colony grid.'
  },
  battery_storage: {
    type: 'battery_storage',
    name: 'Battery Storage Bank',
    category: 'power',
    cost: { iron: 40, silicon: 30 },
    buildTimeHours: 2,
    powerUse: 0,
    storageBonus: { energy: 1000 },
    maxLevel: 3,
    maxHealth: 400,
    workerCapacity: 0,
    footprintRadius: 3.5,
    description: 'Superconducting capacitor banks storing daytime energy surplus for the night.'
  },
  mining_facility: {
    type: 'mining_facility',
    name: 'Automated Mine',
    category: 'industry',
    cost: { iron: 100, titanium: 20 },
    buildTimeHours: 5,
    powerUse: 5,
    production: { iron: 6, titanium: 1.5, silicon: 3 },
    maxLevel: 3,
    maxHealth: 700,
    workerCapacity: 4,
    footprintRadius: 6,
    description: 'Subterranean excavator extracting ore veins and refining raw minerals.'
  },
  resource_storage: {
    type: 'resource_storage',
    name: 'Resource Silo Complex',
    category: 'infrastructure',
    cost: { iron: 50 },
    buildTimeHours: 2,
    powerUse: 0,
    storageBonus: { iron: 1000, titanium: 500, silicon: 500, ice: 500, food: 500, oxygen: 500, water: 500 },
    maxLevel: 3,
    maxHealth: 600,
    workerCapacity: 0,
    footprintRadius: 5,
    description: 'Pressurized storage silos expanding overall colony storage capacity.'
  },
  research_laboratory: {
    type: 'research_laboratory',
    name: 'Research Laboratory',
    category: 'science',
    cost: { iron: 80, silicon: 80 },
    buildTimeHours: 5,
    powerUse: 4,
    production: { research: 5 },
    maxLevel: 3,
    maxHealth: 500,
    workerCapacity: 3,
    footprintRadius: 5.5,
    description: 'Advanced laboratory conducting scientific analysis to unlock breakthrough technologies.'
  },
  communication_tower: {
    type: 'communication_tower',
    name: 'Subspace Comm Tower',
    category: 'infrastructure',
    cost: { titanium: 40, silicon: 40 },
    buildTimeHours: 4,
    powerUse: 2,
    maxLevel: 3,
    maxHealth: 450,
    workerCapacity: 1,
    footprintRadius: 4,
    description: 'Long-range antenna array scanning for unknown signals, deep space alerts, and traders.'
  },
  medical_center: {
    type: 'medical_center',
    name: 'Medical Center',
    category: 'life_support',
    cost: { iron: 90, silicon: 60 },
    buildTimeHours: 4,
    powerUse: 3,
    maxLevel: 3,
    maxHealth: 500,
    workerCapacity: 2,
    footprintRadius: 5,
    description: 'Cryo-treatment bays and quarantine facilities to heal injured or sick colonists.'
  },
  command_center: {
    type: 'command_center',
    name: 'Colony Command Spire',
    category: 'infrastructure',
    cost: { iron: 150, titanium: 50 },
    buildTimeHours: 6,
    powerUse: 3,
    maxLevel: 3,
    maxHealth: 1200,
    workerCapacity: 4,
    footprintRadius: 7,
    description: 'Central administrative spire governing colony operations, telemetry, and tier progression.'
  },
  robotics_facility: {
    type: 'robotics_facility',
    name: 'Robotics Assembly Bay',
    category: 'industry',
    cost: { iron: 120, titanium: 60 },
    buildTimeHours: 5,
    powerUse: 6,
    maxLevel: 3,
    maxHealth: 650,
    workerCapacity: 2,
    footprintRadius: 6,
    description: 'Precision automated factory fabricating mining rovers, repair drones, and transports.'
  },
  defense_system: {
    type: 'defense_system',
    name: 'Point-Defense Plasma Turret',
    category: 'military',
    cost: { titanium: 80, iron: 100 },
    buildTimeHours: 4,
    powerUse: 5,
    maxLevel: 3,
    maxHealth: 800,
    workerCapacity: 1,
    footprintRadius: 4.5,
    description: 'Automated twin-barrel plasma cannon intercepting incoming meteors and hostile threats.'
  },
  spacecraft_hangar: {
    type: 'spacecraft_hangar',
    name: 'Spacecraft Hangar & Yard',
    category: 'infrastructure',
    cost: { iron: 150, titanium: 80 },
    buildTimeHours: 6,
    powerUse: 5,
    maxLevel: 3,
    maxHealth: 1000,
    workerCapacity: 3,
    footprintRadius: 9,
    description: 'Heavy shipyard facility capable of upgrading, retrofitting, and repairing spaceships.'
  }
};
