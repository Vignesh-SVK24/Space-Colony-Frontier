import { describe, it, expect } from 'vitest';
import { useNexusGameStore } from '../src/state/useNexusGameStore';

describe('World Scale & Celestial Simulation Tests', () => {
  it('should initialize with valid celestial coordinates and weather status', () => {
    const state = useNexusGameStore.getState();
    expect(state.shipPosition).toBeDefined();
    expect(state.shipPosition.length).toBe(3);
    expect(state.solarCycleAngle).toBeGreaterThan(0);
    expect(state.moonAngle).toBeGreaterThan(0);
    expect(state.weatherEvent).toBe('CALM');
    expect(state.satelliteNetwork.activeSatellites).toBe(6);
    expect(state.mapScale).toBe('orbit');
  });

  it('should advance solar and moon angles when simulation ticks', () => {
    const store = useNexusGameStore.getState();
    const initialSolar = store.solarCycleAngle;
    const initialMoon = store.moonAngle;

    store.tickSimulation();

    const updated = useNexusGameStore.getState();
    expect(updated.solarCycleAngle).not.toBe(initialSolar);
    expect(updated.moonAngle).not.toBe(initialMoon);
  });

  it('should handle space weather events and trigger advisories', () => {
    const store = useNexusGameStore.getState();
    store.triggerWeatherEvent('SOLAR_STORM');

    const updated = useNexusGameStore.getState();
    expect(updated.weatherEvent).toBe('SOLAR_STORM');
    expect(updated.alerts[0].title).toBe('SPACE WEATHER ADVISORY');
    expect(updated.alerts[0].message).toContain('SOLAR STORM');
  });

  it('should switch map scale levels between all 4 tactical tiers', () => {
    const store = useNexusGameStore.getState();
    store.setMapScale('surface');
    expect(useNexusGameStore.getState().mapScale).toBe('surface');
    store.setMapScale('system');
    expect(useNexusGameStore.getState().mapScale).toBe('system');
    store.setMapScale('deep_space');
    expect(useNexusGameStore.getState().mapScale).toBe('deep_space');
    store.setMapScale('orbit');
    expect(useNexusGameStore.getState().mapScale).toBe('orbit');
  });

  it('should record unique celestial discoveries into log', () => {
    const store = useNexusGameStore.getState();
    const initialCount = store.discoveredLocations.length;

    store.recordDiscovery('test-anomaly-01', 'ANOMALOUS NEBULA CLOUD');
    const updated = useNexusGameStore.getState();
    expect(updated.discoveredLocations.length).toBe(initialCount + 1);
    expect(updated.discoveredLocations).toContain('test-anomaly-01');

    // Duplicate discovery should not add duplicate
    store.recordDiscovery('test-anomaly-01', 'ANOMALOUS NEBULA CLOUD');
    expect(useNexusGameStore.getState().discoveredLocations.length).toBe(initialCount + 1);
  });

  it('should track real-time ship position updates', () => {
    const store = useNexusGameStore.getState();
    store.setShipPosition([45.2, 120.4, -80.1]);

    const updated = useNexusGameStore.getState();
    expect(updated.shipPosition[0]).toBe(45.2);
    expect(updated.shipPosition[1]).toBe(120.4);
    expect(updated.shipPosition[2]).toBe(-80.1);
  });
});
