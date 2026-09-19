import { describe, it, expect } from 'vitest';
import { GAME_CONFIG, BALANCE_CONFIG, RESOURCE_DEFS, BUILDING_DEFS } from '../src/config';
import { getAsset } from '../src/assets/AssetLoader';

describe('Phase 0 Foundation Architecture Tests', () => {
  it('should have valid game configuration parameters', () => {
    expect(GAME_CONFIG.ticksPerSecond).toBe(10);
    expect(GAME_CONFIG.gameHoursPerDay).toBe(24);
    expect(GAME_CONFIG.maxCatchUpTicks).toBeGreaterThan(0);
    expect(BALANCE_CONFIG.colonistConsumptionPerHour.oxygen).toBeGreaterThan(0);
    expect(BALANCE_CONFIG.demolishRefundRatio).toBe(0.75);
  });

  it('should define all 12 core resources with non-zero capacities', () => {
    const resourceKeys = Object.keys(RESOURCE_DEFS);
    expect(resourceKeys.length).toBe(12);
    expect(RESOURCE_DEFS.oxygen.isLifeSupport).toBe(true);
    expect(RESOURCE_DEFS.water.baseCapacity).toBeGreaterThan(0);
  });

  it('should define all 16 colony building types with valid parameters', () => {
    const buildingKeys = Object.keys(BUILDING_DEFS);
    expect(buildingKeys.length).toBe(16);

    for (const [type, def] of Object.entries(BUILDING_DEFS)) {
      expect(def.type).toBe(type);
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.maxHealth).toBeGreaterThan(0);
      expect(def.footprintRadius).toBeGreaterThan(0);
    }
  });

  it('should gracefully provide procedural fallback for declared assets', () => {
    const asset = getAsset('ship_player');
    expect(asset.key).toBe('ship_player');
    expect(asset.kind).toBe('procedural');
    expect(asset.status).toBe('fallback');
  });

  it('should gracefully provide procedural fallback for missing/undeclared assets without crashing', () => {
    const missing = getAsset('totally_non_existent_model');
    expect(missing.key).toBe('totally_non_existent_model');
    expect(missing.kind).toBe('procedural');
    expect(missing.status).toBe('fallback');
  });
});
