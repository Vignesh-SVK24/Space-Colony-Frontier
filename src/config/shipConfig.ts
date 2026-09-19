export interface ShipDef {
  maxSpeed: number;
  acceleration: number;
  boostMultiplier: number;
  rotationSpeed: number;
  fuelCapacity: number;
  fuelConsumptionRate: number;
  hullMax: number;
  shieldMax: number;
  shieldRegenRate: number;
  cargoCapacity: number;
}

export const SHIP_CONFIG: ShipDef = {
  maxSpeed: 45,
  acceleration: 20,
  boostMultiplier: 2.2,
  rotationSpeed: 2.4,
  fuelCapacity: 200,
  fuelConsumptionRate: 1.5, // per second of thrust
  hullMax: 250,
  shieldMax: 150,
  shieldRegenRate: 10, // per second after delay
  cargoCapacity: 200
};
