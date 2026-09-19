export type ResourceId =
  | 'oxygen'
  | 'water'
  | 'food'
  | 'energy'
  | 'iron'
  | 'titanium'
  | 'silicon'
  | 'ice'
  | 'rare'
  | 'fuel'
  | 'research'
  | 'credits';

export interface ResourceDef {
  id: ResourceId;
  name: string;
  icon: string;
  color: string;
  baseCapacity: number;
  isLifeSupport?: boolean;
}

export const RESOURCE_DEFS: Record<ResourceId, ResourceDef> = {
  oxygen: { id: 'oxygen', name: 'Oxygen', icon: 'wind', color: '#38bdf8', baseCapacity: 500, isLifeSupport: true },
  water: { id: 'water', name: 'Water', icon: 'droplet', color: '#60a5fa', baseCapacity: 500, isLifeSupport: true },
  food: { id: 'food', name: 'Food', icon: 'apple', color: '#4ade80', baseCapacity: 500, isLifeSupport: true },
  energy: { id: 'energy', name: 'Energy', icon: 'zap', color: '#facc15', baseCapacity: 1000 },
  iron: { id: 'iron', name: 'Iron', icon: 'box', color: '#94a3b8', baseCapacity: 1000 },
  titanium: { id: 'titanium', name: 'Titanium', icon: 'shield', color: '#c084fc', baseCapacity: 500 },
  silicon: { id: 'silicon', name: 'Silicon', icon: 'cpu', color: '#2dd4bf', baseCapacity: 600 },
  ice: { id: 'ice', name: 'Ice', icon: 'snowflake', color: '#a5f3fc', baseCapacity: 800 },
  rare: { id: 'rare', name: 'Rare Minerals', icon: 'sparkles', color: '#f43f5e', baseCapacity: 300 },
  fuel: { id: 'fuel', name: 'Rocket Fuel', icon: 'flame', color: '#fb923c', baseCapacity: 600 },
  research: { id: 'research', name: 'Research Points', icon: 'flask-conical', color: '#a855f7', baseCapacity: 999999 },
  credits: { id: 'credits', name: 'Credits', icon: 'coins', color: '#eab308', baseCapacity: 9999999 }
};
