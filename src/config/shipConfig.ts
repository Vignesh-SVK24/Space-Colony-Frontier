export interface ShipFlightConfig {
  cruiseSpeed: number;
  maxSpeed: number;
  boostSpeed: number;
  minSpeed: number;
  acceleration: number;
  deceleration: number;
  brakeDeceleration: number;
  boostMultiplier: number;
  yawSpeed: number;
  pitchSpeed: number;
  rollSpeed: number;
  bankFactor: number;
  dampingLinear: number;
  dampingAngular: number;

  // Health and fuel
  fuelCapacity: number;
  normalBurnRate: number; // units/sec
  boostBurnRate: number;  // units/sec
  hullMax: number;
  shieldMax: number;
  shieldRegenRate: number;
  shieldRegenDelay: number;
  cargoCapacity: number;

  // Chase and cockpit cameras
  camera: {
    chaseDistance: number;
    chaseHeight: number;
    chaseLag: number;
    lookAheadLag: number;
    boostFovKick: number;
    cockpitOffset: [number, number, number];
  };

  // Interaction thresholds
  interaction: {
    asteroidScanDistance: number;
    colonyLandDistance: number;
    dockDistance: number;
  };
}

export const SHIP_CONFIG: ShipFlightConfig = {
  cruiseSpeed: 30,
  maxSpeed: 50,
  boostSpeed: 95,
  minSpeed: -15,
  acceleration: 24,
  deceleration: 12,
  brakeDeceleration: 38,
  boostMultiplier: 2.2,
  yawSpeed: 1.6,
  pitchSpeed: 1.6,
  rollSpeed: 2.4,
  bankFactor: 0.6,
  dampingLinear: 0.95,
  dampingAngular: 0.90,

  fuelCapacity: 200,
  normalBurnRate: 1.0,
  boostBurnRate: 3.8,
  hullMax: 250,
  shieldMax: 150,
  shieldRegenRate: 15,
  shieldRegenDelay: 3.0,
  cargoCapacity: 200,

  camera: {
    chaseDistance: 8.5,
    chaseHeight: 2.8,
    chaseLag: 0.08,
    lookAheadLag: 0.12,
    boostFovKick: 12,
    cockpitOffset: [0, 0.45, 0.7]
  },

  interaction: {
    asteroidScanDistance: 14,
    colonyLandDistance: 10,
    dockDistance: 12
  }
};
