export type UFOState =
  | 'DORMANT'
  | 'ARRIVING'
  | 'OBSERVING'
  | 'SCANNING'
  | 'FOLLOWING'
  | 'SIGNALING'
  | 'LEAVING_ARTIFACT'
  | 'TRADING'
  | 'FLEEING'
  | 'HOSTILE'
  | 'ENCOUNTER'
  | 'DEPARTING';

export type UFOVariant = 'scout' | 'saucer' | 'mothership' | 'probe';

export interface UFODef {
  variant: UFOVariant;
  name: string;
  speed: number;
  hull: number;
  lightColor: string;
  scanBeamColor: string;
}

export const UFO_DEFS: Record<UFOVariant, UFODef> = {
  scout: {
    variant: 'scout',
    name: 'Alien Scout Ship',
    speed: 55,
    hull: 300,
    lightColor: '#22d3ee',
    scanBeamColor: '#38bdf8'
  },
  saucer: {
    variant: 'saucer',
    name: 'Extraterrestrial Saucer',
    speed: 40,
    hull: 600,
    lightColor: '#c084fc',
    scanBeamColor: '#d8b4fe'
  },
  mothership: {
    variant: 'mothership',
    name: 'Ancient Mothership',
    speed: 20,
    hull: 2500,
    lightColor: '#fbbf24',
    scanBeamColor: '#fef08a'
  },
  probe: {
    variant: 'probe',
    name: 'Automated Artifact Probe',
    speed: 65,
    hull: 150,
    lightColor: '#34d399',
    scanBeamColor: '#6ee7b7'
  }
};
