import { describe, it, expect, beforeEach } from 'vitest';
import { COMBAT_CONFIG, AI_DIFFICULTY_SETTINGS } from '../src/config/combatConfig';
import { ARENA_OBSTACLES, checkObstacleRaycast, getNearestCover, getCoverHidingPosition } from '../src/config/arenaObstacles';
import { useMultiplayerStore } from '../src/multiplayer/useMultiplayerStore';

describe('Advanced Combat System & Arena Obstacles', () => {
  beforeEach(() => {
    useMultiplayerStore.getState().reset();
  });

  it('should have authoritative combat configuration parameters', () => {
    expect(COMBAT_CONFIG.MAX_HP).toBe(100);
    expect(COMBAT_CONFIG.BULLET_DAMAGE).toBe(10);
    expect(COMBAT_CONFIG.BULLET_COOLDOWN).toBe(0.45);
    expect(COMBAT_CONFIG.LASER_DAMAGE).toBe(20);
    expect(COMBAT_CONFIG.LASER_COOLDOWN).toBe(5.0);
    expect(COMBAT_CONFIG.ARENA_RADIUS).toBe(300);
  });

  it('should define distinct AI difficulty settings for Easy, Normal, and Hard', () => {
    const easy = AI_DIFFICULTY_SETTINGS.EASY;
    const normal = AI_DIFFICULTY_SETTINGS.NORMAL;
    const hard = AI_DIFFICULTY_SETTINGS.HARD;

    expect(easy.reactionTime).toBeGreaterThan(normal.reactionTime);
    expect(normal.reactionTime).toBeGreaterThan(hard.reactionTime);

    expect(easy.firingInterval).toBeGreaterThan(normal.firingInterval);
    expect(normal.firingInterval).toBeGreaterThan(hard.firingInterval);

    expect(easy.useLaser).toBe(false);
    expect(normal.useLaser).toBe(true);
    expect(hard.useLaser).toBe(true);
  });

  it('should register all physical arena obstacles with positions and radii', () => {
    expect(ARENA_OBSTACLES.length).toBeGreaterThanOrEqual(10);
    
    // Check Titan Alpha asteroid
    const titanA = ARENA_OBSTACLES.find(o => o.id === 'obs_titan_alpha');
    expect(titanA).toBeDefined();
    expect(titanA?.radius).toBe(24);
    expect(titanA?.isCover).toBe(true);

    // Check Space Station
    const station = ARENA_OBSTACLES.find(o => o.id === 'obs_station_relay');
    expect(station).toBeDefined();
    expect(station?.type).toBe('station');
    expect(station?.radius).toBe(28);
  });

  it('should correctly block line of sight when an obstacle is between shooter and target', () => {
    const titanA = ARENA_OBSTACLES.find(o => o.id === 'obs_titan_alpha')!;
    
    // Position shooter directly on one side of Titan Alpha, and target on opposite side
    const shooterPos = [titanA.position[0] - 40, titanA.position[1], titanA.position[2]];
    const targetPos = [titanA.position[0] + 40, titanA.position[1], titanA.position[2]];

    const raycast = checkObstacleRaycast(
      shooterPos[0], shooterPos[1], shooterPos[2],
      targetPos[0], targetPos[1], targetPos[2]
    );

    expect(raycast.blocked).toBe(true);
    expect(raycast.obstacle?.id).toBe('obs_titan_alpha');
    expect(raycast.hitPoint).toBeDefined();
  });

  it('should allow line of sight when path between shooter and target is clear', () => {
    // Open space trajectory away from obstacles
    const shooterPos = [0, 0, 0];
    const targetPos = [0, 50, 0];

    const raycast = checkObstacleRaycast(
      shooterPos[0], shooterPos[1], shooterPos[2],
      targetPos[0], targetPos[1], targetPos[2]
    );

    expect(raycast.blocked).toBe(false);
    expect(raycast.obstacle).toBeNull();
  });

  it('should calculate safe hiding position on the far side of cover', () => {
    const titanA = ARENA_OBSTACLES.find(o => o.id === 'obs_titan_alpha')!;
    const threatPos: [number, number, number] = [titanA.position[0] - 60, titanA.position[1], titanA.position[2]];
    const agentPos: [number, number, number] = [titanA.position[0] - 10, titanA.position[1], titanA.position[2]];

    const nearest = getNearestCover(agentPos[0], agentPos[1], agentPos[2]);
    expect(nearest).toBeDefined();

    const coverInfo = getCoverHidingPosition(agentPos, threatPos);
    expect(coverInfo).toBeDefined();
    expect(coverInfo?.obstacle.id).toBe('obs_titan_alpha');
    
    // Hiding position must be behind the obstacle relative to threat
    const hidePos = coverInfo!.position;
    expect(hidePos[0]).toBeGreaterThan(titanA.position[0]);
  });

  it('should support tactical map toggle and weapon cooldown updates in store', () => {
    const store = useMultiplayerStore.getState();

    // Tactical map toggle
    expect(store.isMapOpen).toBe(false);
    store.setMapOpen(true);
    expect(useMultiplayerStore.getState().isMapOpen).toBe(true);
    store.toggleMap();
    expect(useMultiplayerStore.getState().isMapOpen).toBe(false);

    // Laser & Bullet cooldown tracking
    store.setLaserCooldownRemaining(3.5);
    expect(useMultiplayerStore.getState().laserCooldownRemaining).toBe(3.5);

    store.setBulletCooldownRemaining(0.2);
    expect(useMultiplayerStore.getState().bulletCooldownRemaining).toBe(0.2);

    // AI difficulty selection
    store.setAIDifficulty('HARD');
    expect(useMultiplayerStore.getState().aiDifficulty).toBe('HARD');
  });

  it('should correctly configure solo battle with chosen difficulty and callsign', () => {
    const store = useMultiplayerStore.getState();
    store.setPlayerName('Viper');
    store.setPlayerColor('blue');
    store.setAIDifficulty('HARD');

    store.startSoloGame();

    const state = useMultiplayerStore.getState();
    expect(state.isSolo).toBe(true);
    expect(state.playerName).toBe('Viper');
    expect(state.playerColor).toBe('blue');
    expect(state.aiDifficulty).toBe('HARD');
    expect(state.opponentName).toContain('HARD');
    expect(state.appView).toBe('BATTLE');
    expect(state.selfState?.hp).toBe(100);
    expect(state.opponentState?.hp).toBe(100);
  });
});
