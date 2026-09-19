import { describe, it, expect, beforeEach } from 'vitest';
import { useNexusGameStore } from '../src/state/useNexusGameStore';
import { SHIP_CONFIG } from '../src/config/shipConfig';
import { getTerrainHeight } from '../src/components/three/surface/terrainMath';

describe('Full 3D Spaceship Flight & Attitude Telemetry', () => {
  beforeEach(() => {
    useNexusGameStore.setState({
      gameMode: 'SPACE_FLIGHT',
      shipPosition: [0, 15, 20],
      flightSpeed: 0,
      verticalSpeed: 0,
      altitude: 16.4,
      heading: 0,
      pitch: 0,
      roll: 0,
      flightAssist: true,
      flightWarnings: [],
      activeWaypoint: null,
      distanceToWaypoint: null
    });
  });

  it('contains vertical flight parameters in SHIP_CONFIG', () => {
    expect(SHIP_CONFIG.verticalAcceleration).toBeGreaterThan(15);
    expect(SHIP_CONFIG.verticalMaxSpeed).toBeGreaterThan(20);
    expect(SHIP_CONFIG.verticalDamping).toBeGreaterThan(0.9);
    expect(SHIP_CONFIG.flightAssist).toBe(true);
  });

  it('records full 3D flight telemetry including vertical speed and attitude', () => {
    const store = useNexusGameStore.getState();

    store.setFlight3DTelemetry({
      speed: 42,
      verticalSpeed: 8.5,
      altitude: 35.2,
      heading: 184,
      pitch: 12,
      roll: -4,
      isBoosting: false,
      isBraking: false,
      warnings: []
    });

    const updated = useNexusGameStore.getState();
    expect(updated.flightSpeed).toBe(42);
    expect(updated.verticalSpeed).toBe(8.5);
    expect(updated.altitude).toBe(35.2);
    expect(updated.heading).toBe(184);
    expect(updated.pitch).toBe(12);
    expect(updated.roll).toBe(-4);
  });

  it('triggers flight warnings on rapid descent or low altitude', () => {
    const store = useNexusGameStore.getState();

    store.setFlight3DTelemetry({
      speed: 30,
      verticalSpeed: -16.2,
      altitude: 2.4,
      heading: 0,
      pitch: -15,
      roll: 0,
      isBoosting: false,
      isBraking: false,
      warnings: ['CRITICAL ALTITUDE', 'HIGH DESCENT RATE']
    });

    const updated = useNexusGameStore.getState();
    expect(updated.flightWarnings).toContain('CRITICAL ALTITUDE');
    expect(updated.flightWarnings).toContain('HIGH DESCENT RATE');
  });

  it('toggles flight assist mode cleanly', () => {
    const store = useNexusGameStore.getState();
    expect(store.flightAssist).toBe(true);

    store.toggleFlightAssist();
    expect(useNexusGameStore.getState().flightAssist).toBe(false);

    store.toggleFlightAssist();
    expect(useNexusGameStore.getState().flightAssist).toBe(true);
  });
});

describe('3D Waypoint System & Map Distance Decomposition', () => {
  beforeEach(() => {
    useNexusGameStore.setState({
      shipPosition: [0, 10, 0],
      astronautPosition: [2, -1.3, 3],
      gameMode: 'SPACE_FLIGHT',
      activeWaypoint: null,
      distanceToWaypoint: null
    });
  });

  it('sets 3D waypoint and computes horizontal, vertical, and total vector distances', () => {
    const store = useNexusGameStore.getState();

    // Target at [30, 50, 40]
    // Ship at [0, 10, 0]
    // dx = 30, dy = 40, dz = 40
    // horizontal = sqrt(30^2 + 40^2) = 50
    // total = sqrt(30^2 + 40^2 + 40^2) = sqrt(900 + 1600 + 1600) = sqrt(4100) ≈ 64.03
    store.setWaypoint({
      id: 'test-apex',
      name: 'APEX RESEARCH HUB',
      position: [30, 50, 40],
      type: 'station'
    });

    const updated = useNexusGameStore.getState();
    expect(updated.activeWaypoint?.name).toBe('APEX RESEARCH HUB');
    expect(updated.distanceToWaypoint).not.toBeNull();
    expect(updated.distanceToWaypoint!.horizontal).toBeCloseTo(50, 1);
    expect(updated.distanceToWaypoint!.vertical).toBeCloseTo(40, 1);
    expect(updated.distanceToWaypoint!.total).toBeCloseTo(64.03, 1);
  });

  it('clears active waypoint upon request', () => {
    const store = useNexusGameStore.getState();
    store.setWaypoint({
      id: 'wp-1',
      name: 'DEPOT',
      position: [10, 20, 10],
      type: 'station'
    });

    expect(useNexusGameStore.getState().activeWaypoint).not.toBeNull();

    store.clearWaypoint();
    expect(useNexusGameStore.getState().activeWaypoint).toBeNull();
    expect(useNexusGameStore.getState().distanceToWaypoint).toBeNull();
  });
});

describe('Surface Clearance Calculation via Deterministic Heightfield', () => {
  it('measures real clearance above terrain', () => {
    const shipPos = [0, 20, 0] as const;
    const groundH = getTerrainHeight(shipPos[0], shipPos[2]);
    const clearance = shipPos[1] - groundH;

    expect(groundH).toBeCloseTo(-1.4, 2);
    expect(clearance).toBeCloseTo(21.4, 1);
  });
});
