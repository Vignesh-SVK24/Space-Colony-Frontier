export const GAME_CONFIG = {
  title: 'SPACE COLONY: FRONTIER',
  version: '0.1.0',
  ticksPerSecond: 10,
  maxCatchUpTicks: 5,
  gameHoursPerDay: 24,
  realSecondsPerGameDay: 600, // 10 real minutes at 1x
  speedMultipliers: {
    pause: 0,
    normal: 1,
    fast: 2,
    ultra: 5
  },
  seedDefault: 42819,
  colonyRadius: 250,
  maxEntities: 1000
} as const;
