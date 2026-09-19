import { describe, it, expect } from 'vitest';
import { SHIP_CONFIG } from '../src/config/shipConfig';

describe('Spaceship Flight Physics & Kinematics Tests', () => {
  it('should have valid flight envelope parameters', () => {
    expect(SHIP_CONFIG.cruiseSpeed).toBeGreaterThan(0);
    expect(SHIP_CONFIG.maxSpeed).toBeGreaterThan(SHIP_CONFIG.cruiseSpeed);
    expect(SHIP_CONFIG.boostSpeed).toBeGreaterThan(SHIP_CONFIG.maxSpeed);
    expect(SHIP_CONFIG.boostMultiplier).toBeGreaterThan(1.5);
  });

  it('should enforce smooth rotational rates and banking factor', () => {
    expect(SHIP_CONFIG.yawSpeed).toBeGreaterThan(0);
    expect(SHIP_CONFIG.pitchSpeed).toBeGreaterThan(0);
    expect(SHIP_CONFIG.rollSpeed).toBeGreaterThan(0);
    expect(SHIP_CONFIG.bankFactor).toBeGreaterThan(0.2);
    expect(SHIP_CONFIG.bankFactor).toBeLessThanOrEqual(1.0);
  });

  it('should have stable linear and angular damping factors (0 < d < 1)', () => {
    expect(SHIP_CONFIG.dampingLinear).toBeGreaterThan(0.8);
    expect(SHIP_CONFIG.dampingLinear).toBeLessThan(1.0);
    expect(SHIP_CONFIG.dampingAngular).toBeGreaterThan(0.8);
    expect(SHIP_CONFIG.dampingAngular).toBeLessThan(1.0);
  });

  it('should configure third-person chase camera and cockpit offsets', () => {
    expect(SHIP_CONFIG.camera.chaseDistance).toBeGreaterThan(5);
    expect(SHIP_CONFIG.camera.chaseHeight).toBeGreaterThan(1);
    expect(SHIP_CONFIG.camera.boostFovKick).toBeGreaterThan(5);
    expect(SHIP_CONFIG.camera.cockpitOffset.length).toBe(3);
  });

  it('should define proximity interaction radii', () => {
    expect(SHIP_CONFIG.interaction.asteroidScanDistance).toBeGreaterThan(5);
    expect(SHIP_CONFIG.interaction.colonyLandDistance).toBeGreaterThan(5);
  });
});
