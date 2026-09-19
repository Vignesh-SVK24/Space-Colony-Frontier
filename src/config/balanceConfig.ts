export const BALANCE_CONFIG = {
  colonistConsumptionPerHour: {
    oxygen: 0.5,
    water: 0.3,
    food: 0.2
  },
  thresholds: {
    warning: 0.30, // 30%
    critical: 0.15 // 15%
  },
  difficultyModifiers: {
    relaxed: { consumption: 0.7, eventFrequency: 0.6, damage: 0.5 },
    normal: { consumption: 1.0, eventFrequency: 1.0, damage: 1.0 },
    hard: { consumption: 1.3, eventFrequency: 1.4, damage: 1.5 }
  },
  demolishRefundRatio: 0.75
} as const;
