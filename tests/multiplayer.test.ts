import { describe, it, expect, beforeEach } from 'vitest';
import { useMultiplayerStore } from '../src/multiplayer/useMultiplayerStore';
import { VISUAL_THEME } from '../src/config/visualTheme';
import { GameSnapshot } from '../src/multiplayer/types';

describe('Multiplayer System Tests', () => {
  beforeEach(() => {
    useMultiplayerStore.getState().reset();
  });

  it('should initialize with default landing view', () => {
    const state = useMultiplayerStore.getState();
    expect(state.appView).toBe('LANDING');
    expect(state.playerColor).toBe('yellow');
    expect(state.roomStatus).toBe('WAITING');
    expect(state.selfState).toBeNull();
    expect(state.opponentState).toBeNull();
  });

  it('should allow setting player name and color', () => {
    useMultiplayerStore.getState().setPlayerName('Viper-1');
    useMultiplayerStore.getState().setPlayerColor('red');
    
    const state = useMultiplayerStore.getState();
    expect(state.playerName).toBe('Viper-1');
    expect(state.playerColor).toBe('red');
  });

  it('should correctly configure all 4 battle paint schemes in visual theme', () => {
    const schemes = VISUAL_THEME.spaceshipPaintSchemes;
    expect(schemes.battle_yellow.primaryHull).toBe('#eab308');
    expect(schemes.battle_blue.primaryHull).toBe('#3b82f6');
    expect(schemes.battle_red.primaryHull).toBe('#ef4444');
    expect(schemes.battle_green.primaryHull).toBe('#22c55e');
  });

  it('should handle room creation and joining state transitions', () => {
    useMultiplayerStore.getState().setRoomCode('A8X2');
    useMultiplayerStore.getState().setPlayerId('sock_123');
    useMultiplayerStore.getState().setIsHost(true);
    useMultiplayerStore.getState().setAppView('LOBBY');

    let state = useMultiplayerStore.getState();
    expect(state.roomCode).toBe('A8X2');
    expect(state.isHost).toBe(true);
    expect(state.appView).toBe('LOBBY');

    // Simulate opponent joining
    useMultiplayerStore.getState().setOpponentInfo('ShadowAce', 'blue');
    state = useMultiplayerStore.getState();
    expect(state.opponentName).toBe('ShadowAce');
    expect(state.opponentColor).toBe('blue');
  });

  it('should ingest game snapshots and separate self and opponent states', () => {
    useMultiplayerStore.getState().setPlayerId('player_local');

    const testSnapshot: GameSnapshot = {
      players: [
        {
          id: 'player_local',
          name: 'LocalPilot',
          color: 'green',
          position: [0, 5, 10],
          rotation: [0, 1.5, 0],
          velocity: [0, 0, 20],
          hp: 90,
          maxHp: 100,
          alive: true,
          throttle: 0.8,
          isBoosting: true
        },
        {
          id: 'player_remote',
          name: 'RemoteEnemy',
          color: 'red',
          position: [20, 5, 100],
          rotation: [0, -1.5, 0],
          velocity: [0, 0, 15],
          hp: 70,
          maxHp: 100,
          alive: true,
          throttle: 0.5,
          isBoosting: false
        }
      ],
      projectiles: [
        {
          id: 'laser_1',
          ownerId: 'player_local',
          position: [0, 5, 20],
          direction: [0, 0, 1],
          color: 'green',
          createdAt: Date.now()
        }
      ],
      timestamp: Date.now(),
      roomStatus: 'BATTLE'
    };

    useMultiplayerStore.getState().updateFromSnapshot(testSnapshot);

    const state = useMultiplayerStore.getState();
    expect(state.selfState?.id).toBe('player_local');
    expect(state.selfState?.hp).toBe(90);
    expect(state.selfState?.isBoosting).toBe(true);

    expect(state.opponentState?.id).toBe('player_remote');
    expect(state.opponentState?.hp).toBe(70);

    expect(state.projectiles.length).toBe(1);
    expect(state.projectiles[0].ownerId).toBe('player_local');
  });

  it('should handle match completion with stats and reset', () => {
    useMultiplayerStore.getState().setPlayerId('pilot_1');
    useMultiplayerStore.getState().setPlayerName('Ace');
    useMultiplayerStore.getState().setOpponentInfo('Ghost', 'blue');

    useMultiplayerStore.getState().handleMatchEnd({
      winner: 'pilot_1',
      winnerName: 'Ace',
      loserName: 'Ghost',
      mode: '1v1',
      damageDealt: 100,
      shotsHit: 10,
      shotsFired: 12,
      accuracy: 83,
      matchDuration: 54
    });

    let state = useMultiplayerStore.getState();
    expect(state.appView).toBe('RESULT');
    expect(state.roomStatus).toBe('FINISHED');
    expect(state.matchResult?.winner).toBe('pilot_1');
    expect(state.matchResult?.accuracy).toBe(83);

    // Reset back to landing
    useMultiplayerStore.getState().reset();
    state = useMultiplayerStore.getState();
    expect(state.appView).toBe('LANDING');
    expect(state.matchResult).toBeNull();
    expect(state.roomCode).toBe('');
  });

  it('should initialize solo practice game with player and AI combat drone', () => {
    useMultiplayerStore.getState().setPlayerName('Falcon');
    useMultiplayerStore.getState().setPlayerColor('blue');
    useMultiplayerStore.getState().startSoloGame();

    const state = useMultiplayerStore.getState();
    expect(state.isSolo).toBe(true);
    expect(state.appView).toBe('BATTLE');
    expect(state.roomStatus).toBe('BATTLE');
    expect(state.selfState?.name).toBe('Falcon');
    expect(state.selfState?.color).toBe('blue');
    expect(state.selfState?.hp).toBe(250);

    expect(state.opponentState?.id).toBe('solo_ai_drone');
    expect(state.opponentState?.name).toContain('TARGET DRONE');
    expect(state.opponentState?.hp).toBe(250);
  });

  it('should accurately apply damage and update telemetry in solo mode', () => {
    useMultiplayerStore.getState().startSoloGame();

    // Damage player
    useMultiplayerStore.getState().applyDamageToSoloPlayer(20);
    expect(useMultiplayerStore.getState().selfState?.hp).toBe(230);

    // Damage AI drone
    useMultiplayerStore.getState().applyDamageToSoloOpponent(30);
    expect(useMultiplayerStore.getState().opponentState?.hp).toBe(220);

    // Add solo projectile
    useMultiplayerStore.getState().addSoloProjectile({
      id: 'test_laser',
      attackId: 'test_atk',
      ownerId: 'solo_player',
      weaponType: 'BULLET',
      team: 'NONE',
      speed: 120,
      damage: 2,
      position: [0, 5, 10],
      direction: [0, 0, 100],
      color: 'blue',
      createdAt: Date.now()
    });
    expect(useMultiplayerStore.getState().projectiles.length).toBe(1);
  });

  it('should format connection errors informatively instead of cryptic failed to fetch', async () => {
    const { formatConnectionError } = await import('../src/multiplayer/colyseusClient');
    
    // Local server error
    const localErr = new TypeError('Failed to fetch');
    const localMsg = formatConnectionError(localErr, 'ws://localhost:3001');
    expect(localMsg).toContain('Cannot reach game server at ws://localhost:3001');
    expect(localMsg).toContain("npm run server");

    // Remote server error
    const remoteErr = new Error('NetworkError when attempting to fetch resource.');
    const remoteMsg = formatConnectionError(remoteErr, 'wss://game.example.com');
    expect(remoteMsg).toContain('Cannot reach multiplayer server at wss://game.example.com');

    // Generic error
    const genErr = new Error('Custom room error 404');
    const genMsg = formatConnectionError(genErr, 'ws://localhost:3001');
    expect(genMsg).toBe('Custom room error 404');
  });

  it('should manage custom server URLs and reachability', async () => {
    const store = useMultiplayerStore.getState();
    expect(store.serverUrl).toBeDefined();

    store.setServerUrl('http://myserver.example.com:3001');
    expect(useMultiplayerStore.getState().serverUrl).toBe('http://myserver.example.com:3001');
  });
});
