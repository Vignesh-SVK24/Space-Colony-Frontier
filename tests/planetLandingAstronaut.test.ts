import { describe, it, expect, beforeEach } from 'vitest';
import { useNexusGameStore } from '../src/state/useNexusGameStore';
import { getTerrainHeight, getBiomeAt } from '../src/components/three/surface/terrainMath';

describe('Planet Landing & Astronaut Mode State Machine', () => {
  beforeEach(() => {
    useNexusGameStore.setState({
      gameMode: 'SPACE_FLIGHT',
      landingProgress: 0,
      takeoffProgress: 0,
      suitOxygen: 100,
      suitEnergy: 100,
      astronautPosition: [2, -1.3, 3],
      activeBiome: 'COLONY_OUTPOST',
      landedShipPosition: [0, -1.4, 0]
    });
  });

  it('initiates descent sequence and locks trajectory', () => {
    const store = useNexusGameStore.getState();
    store.initiateLandingSequence();

    const updated = useNexusGameStore.getState();
    expect(updated.gameMode).toBe('DESCENDING');
    expect(updated.landingProgress).toBeGreaterThan(0);
  });

  it('transitions from touchdown to blank landing transition', () => {
    const store = useNexusGameStore.getState();
    store.completeTouchdown();

    const updated = useNexusGameStore.getState();
    expect(updated.gameMode).toBe('LANDING_TRANSITION');
    expect(updated.transitionMessage).toContain('TOUCHDOWN CONFIRMED');
  });

  it('completes landing transition and deploys EVA astronaut near landed ship', () => {
    const store = useNexusGameStore.getState();
    store.finishLandingTransition();

    const updated = useNexusGameStore.getState();
    expect(updated.gameMode).toBe('ASTRONAUT');
    expect(updated.astronautPosition[0]).toBeCloseTo(2.5, 1);
    expect(updated.astronautPosition[2]).toBeCloseTo(2.5, 1);
  });

  it('consumes oxygen in harsh terrain and triggers warnings at critical threshold', () => {
    const store = useNexusGameStore.getState();
    store.consumeOxygen(65); // 100 -> 35 (caution)

    let state = useNexusGameStore.getState();
    expect(state.suitOxygen).toBe(35);

    store.consumeOxygen(20); // 35 -> 15 (critical)
    state = useNexusGameStore.getState();
    expect(state.suitOxygen).toBe(15);

    // Replenish at station or ship
    store.refillSuitVitals();
    state = useNexusGameStore.getState();
    expect(state.suitOxygen).toBe(100);
  });

  it('updates astronaut telemetry and evaluates biomes properly', () => {
    const store = useNexusGameStore.getState();

    // At colony center
    store.setAstronautTelemetry([0, -1.3, 0], 0, 'WALK');
    expect(useNexusGameStore.getState().activeBiome).toBe('COLONY_OUTPOST');

    // Forest quadrant
    store.setAstronautTelemetry([35, 1.2, 20], 1.2, 'RUN');
    expect(useNexusGameStore.getState().activeBiome).toBe('BIOLUMINESCENT_FOREST');

    // Crater quadrant
    store.setAstronautTelemetry([-35, 0.5, 30], -0.8, 'SCAN');
    expect(useNexusGameStore.getState().activeBiome).toBe('ANOMALY_CRATER');
  });

  it('interacts with POI and awards exploration resources', () => {
    const store = useNexusGameStore.getState();
    const initialResearch = store.resources.research.current;

    store.interactWithPOI('poi-terminal');

    const updated = useNexusGameStore.getState();
    expect(updated.resources.research.current).toBe(initialResearch + 300);
    const poi = updated.planetaryPOIs.find(p => p.id === 'poi-terminal');
    expect(poi?.interacted).toBe(true);
  });

  it('executes liftoff and returns safely to orbital space flight', () => {
    const store = useNexusGameStore.getState();
    store.initiateTakeoffSequence();

    expect(useNexusGameStore.getState().gameMode).toBe('TAKEOFF');

    store.finishTakeoff();

    const updated = useNexusGameStore.getState();
    expect(updated.gameMode).toBe('SPACE_FLIGHT');
    expect(updated.shipPosition[1]).toBeGreaterThanOrEqual(14);
  });
});

describe('Terrain Mathematics & Biome Mapping', () => {
  it('maintains a perfectly level landing pad at colony origin', () => {
    const centerHeight = getTerrainHeight(0, 0);
    const padEdgeHeight = getTerrainHeight(8, 6);
    expect(centerHeight).toBeCloseTo(-1.4, 2);
    expect(padEdgeHeight).toBeCloseTo(-1.4, 1);
  });

  it('generates elevation variation outside colony perimeter', () => {
    const mountainHeight = getTerrainHeight(60, 40);
    expect(typeof mountainHeight).toBe('number');
    expect(mountainHeight).not.toBe(-1.4);
  });

  it('accurately identifies active biomes', () => {
    const colonyBiome = getBiomeAt(5, 5);
    expect(colonyBiome.type).toBe('COLONY_OUTPOST');

    const forestBiome = getBiomeAt(40, 25);
    expect(forestBiome.type).toBe('BIOLUMINESCENT_FOREST');

    const craterBiome = getBiomeAt(-45, 35);
    expect(craterBiome.type).toBe('ANOMALY_CRATER');
  });
});
