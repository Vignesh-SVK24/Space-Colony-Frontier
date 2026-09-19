import { describe, it, expect } from 'vitest';
import { useNexusGameStore } from '../src/state/useNexusGameStore';

describe('Nexus Game Store Unit Tests', () => {
  it('should initialize with valid world and colony vitals', () => {
    const state = useNexusGameStore.getState();
    expect(state.solDay).toBe(34);
    expect(state.timeMultiplier).toBe(1);
    expect(state.colonyVitals.health).toBeGreaterThan(0);
    expect(state.colonyVitals.overallStatus).toBe('OPTIMAL');
  });

  it('should have all 12 resources properly populated', () => {
    const { resources } = useNexusGameStore.getState();
    expect(Object.keys(resources).length).toBe(12);
    expect(resources.oxygen.current).toBeGreaterThan(0);
    expect(resources.energy.current).toBeGreaterThan(0);
    expect(resources.credits.current).toBeGreaterThan(0);
  });

  it('should support simulation speed toggles', () => {
    const store = useNexusGameStore.getState();
    store.setTimeMultiplier(2);
    expect(useNexusGameStore.getState().timeMultiplier).toBe(2);
    store.setTimeMultiplier(0);
    expect(useNexusGameStore.getState().timeMultiplier).toBe(0);
    store.setTimeMultiplier(1);
    expect(useNexusGameStore.getState().timeMultiplier).toBe(1);
  });

  it('should handle modal opening and closing', () => {
    const store = useNexusGameStore.getState();
    expect(store.activeModal).toBe(null);
    store.openModal('build');
    expect(useNexusGameStore.getState().activeModal).toBe('build');
    store.closeModal();
    expect(useNexusGameStore.getState().activeModal).toBe(null);
  });

  it('should select and clear entity targets', () => {
    const store = useNexusGameStore.getState();
    store.selectEntity({
      id: 'test-ast',
      name: 'TEST ASTEROID',
      type: 'asteroid',
      status: 'MINABLE',
      metrics: [{ label: 'YIELD', value: '500' }],
      actions: [{ id: 'scan', label: 'SCAN' }]
    });

    expect(useNexusGameStore.getState().selectedEntity.id).toBe('test-ast');
    expect(useNexusGameStore.getState().selectedEntity.name).toBe('TEST ASTEROID');

    store.clearSelection();
    expect(useNexusGameStore.getState().selectedEntity.type).toBe('none');
  });

  it('should add and dismiss alerts', () => {
    const store = useNexusGameStore.getState();
    const initialCount = store.alerts.length;

    store.addAlert({
      type: 'warning',
      title: 'TEST ANOMALY DETECTED',
      message: 'Sensor disruption logged in sector 3.'
    });

    const newAlerts = useNexusGameStore.getState().alerts;
    expect(newAlerts.length).toBeGreaterThanOrEqual(initialCount);
    expect(newAlerts[0].title).toBe('TEST ANOMALY DETECTED');

    store.dismissAlert(newAlerts[0].id);
    expect(useNexusGameStore.getState().alerts.find((a) => a.title === 'TEST ANOMALY DETECTED')).toBeUndefined();
  });
});
