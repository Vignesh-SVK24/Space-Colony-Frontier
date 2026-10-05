import { describe, it, expect, beforeEach } from 'vitest';
import { COMBAT_CONFIG } from '../src/config/combatConfig';
import { ARENA_OBSTACLES, checkObstacleRaycast } from '../src/config/arenaObstacles';
import { useMultiplayerStore } from '../src/multiplayer/useMultiplayerStore';
import { DamageEvent, GameSnapshot } from '../src/multiplayer/types';
import { checkSegmentSphereCollision } from '../server/src/arenaObstacles';
import { CombatSystem } from '../server/src/CombatSystem';
import { Room, RoomState, COMBAT } from '../server/src/types';

describe('Authoritative Combat Hit Detection & Real HP Damage Pipeline', () => {
  beforeEach(() => {
    useMultiplayerStore.getState().reset();
  });

  it('1. Direct hit at 10m applies exact authoritative damage (Bullet = 2 HP, Laser = 12 HP, Solar = 30 HP)', () => {
    const store = useMultiplayerStore.getState();
    store.startSoloGame();

    const initialSelf = useMultiplayerStore.getState().selfState;
    const initialOpp = useMultiplayerStore.getState().opponentState;

    expect(initialSelf?.hp).toBe(250);
    expect(initialOpp?.hp).toBe(250);

    // Apply Bullet Damage (2 HP)
    useMultiplayerStore.getState().applyDamageToSoloOpponent(COMBAT_CONFIG.BULLET_DAMAGE);
    expect(useMultiplayerStore.getState().opponentState?.hp).toBe(248);

    // Apply Laser Damage (12 HP)
    useMultiplayerStore.getState().applyDamageToSoloOpponent(COMBAT_CONFIG.LASER_DAMAGE);
    expect(useMultiplayerStore.getState().opponentState?.hp).toBe(236);

    // Apply Solar Beam Damage (30 HP)
    useMultiplayerStore.getState().applyDamageToSoloOpponent(COMBAT_CONFIG.SOLAR_DAMAGE);
    expect(useMultiplayerStore.getState().opponentState?.hp).toBe(206);
  });

  it('2. Authoritative server applyDamage enforces bullet=10, laser=20, and deduplicates attackId', () => {
    const mockIo = {
      to: () => ({
        emit: () => {}
      })
    } as any;

    const combatSystem = new CombatSystem(mockIo);

    const room: Room = {
      id: 'test_room',
      code: 'TEST01',
      state: RoomState.BATTLE,
      players: new Map([
        ['player_1', {
          id: 'player_1',
          name: 'Pilot Alpha',
          color: 'blue',
          position: { x: 0, y: 15, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          hp: 100,
          maxHp: 100,
          score: 0,
          lastInput: { thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false },
          lastShootTime: 0,
          lastLaserTime: 0,
          spawnTime: 0, // past spawn protection
          ready: true
        }],
        ['player_2', {
          id: 'player_2',
          name: 'Pilot Bravo',
          color: 'red',
          position: { x: 0, y: 15, z: 10 }, // 10m away
          rotation: { x: 0, y: Math.PI, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          hp: 100,
          maxHp: 100,
          score: 0,
          lastInput: { thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false },
          lastShootTime: 0,
          lastLaserTime: 0,
          spawnTime: 0,
          ready: true
        }]
      ]),
      projectiles: [],
      processedAttacks: new Set<string>(),
      tickCount: 42,
      createdAt: Date.now()
    };

    const target = room.players.get('player_2')!;
    expect(target.hp).toBe(100);

    // Apply bullet damage (10 HP)
    combatSystem.applyDamage(room, 'player_2', COMBAT.BULLET_DAMAGE, 'bullet', 'player_1', 'BULLET_001');
    expect(target.hp).toBe(90);

    // Re-send the exact same attackId (simulating duplicate network packet or multi-tick swept collision)
    combatSystem.applyDamage(room, 'player_2', COMBAT.BULLET_DAMAGE, 'bullet', 'player_1', 'BULLET_001');
    // HP must REMAIN 90, NOT drop to 80
    expect(target.hp).toBe(90);

    // Apply laser damage (20 HP) with unique attackId
    combatSystem.applyDamage(room, 'player_2', COMBAT.LASER_DAMAGE, 'laser', 'player_1', 'LASER_002');
    expect(target.hp).toBe(70);

    // Deduplication check on laser attackId
    combatSystem.applyDamage(room, 'player_2', COMBAT.LASER_DAMAGE, 'laser', 'player_1', 'LASER_002');
    expect(target.hp).toBe(70);
  });

  it('3. Swept continuous collision detection accurately tests against combat hitbox', () => {
    const targetPos = { x: 0, y: 15, z: 50 };
    const hitboxRadius = COMBAT.BULLET_HITBOX_RADIUS;
    expect(hitboxRadius).toBe(9.8);

    // Direct center shot: ray passing through (0, 15, 0) to (0, 15, 100)
    const directHit = checkSegmentSphereCollision(
      0, 15, 0,
      0, 15, 100,
      targetPos.x, targetPos.y, targetPos.z,
      hitboxRadius
    );
    expect(directHit.hit).toBe(true);

    // Grazing shot at 5.0m offset (within 9.8m forgiving hitbox)
    const grazingHit = checkSegmentSphereCollision(
      5.0, 15, 0,
      5.0, 15, 100,
      targetPos.x, targetPos.y, targetPos.z,
      hitboxRadius
    );
    expect(grazingHit.hit).toBe(true);

    // Complete miss at 15.0m offset (outside 9.8m hitbox)
    const cleanMiss = checkSegmentSphereCollision(
      15.0, 15, 0,
      15.0, 15, 100,
      targetPos.x, targetPos.y, targetPos.z,
      hitboxRadius
    );
    expect(cleanMiss.hit).toBe(false);
  });

  it('4. Obstacle occlusion: Asteroid blocks bullet & laser line of sight', () => {
    const asteroid = ARENA_OBSTACLES.find(o => o.id === 'obs_titan_alpha')!;
    expect(asteroid).toBeDefined();

    // Attacker on one side, defender on opposite side
    const attackerPos = [asteroid.position[0] - 50, asteroid.position[1], asteroid.position[2]];
    const defenderPos = [asteroid.position[0] + 50, asteroid.position[1], asteroid.position[2]];

    const raycast = checkObstacleRaycast(
      attackerPos[0], attackerPos[1], attackerPos[2],
      defenderPos[0], defenderPos[1], defenderPos[2]
    );

    expect(raycast.blocked).toBe(true);
    expect(raycast.obstacle?.id).toBe(asteroid.id);
  });

  it('5. Server tick sequence protection prevents client HP rollback from delayed snapshots', () => {
    const store = useMultiplayerStore.getState();
    store.setPlayerId('client_p1');
    store.setOpponentInfo('Opponent', 'red');

    // Initial snapshot at tick 10 with 100 HP
    const snapshot10: GameSnapshot = {
      players: [
        {
          id: 'client_p1',
          name: 'P1',
          color: 'blue',
          position: [0, 15, 0],
          rotation: [0, 0, 0],
          velocity: [0, 0, 0],
          hp: 100,
          maxHp: 100,
          alive: true,
          throttle: 0,
          isBoosting: false
        },
        {
          id: 'client_p2',
          name: 'P2',
          color: 'red',
          position: [0, 15, 50],
          rotation: [0, Math.PI, 0],
          velocity: [0, 0, 0],
          hp: 100,
          maxHp: 100,
          alive: true,
          throttle: 0,
          isBoosting: false
        }
      ],
      projectiles: [],
      serverTick: 10,
      timestamp: 1000,
      roomStatus: 'BATTLE'
    };

    store.updateFromSnapshot(snapshot10);
    expect(useMultiplayerStore.getState().selfState?.hp).toBe(100);
    expect(useMultiplayerStore.getState().opponentState?.hp).toBe(100);

    // Damage event occurs at serverTick 25 (Player 1 takes 20 laser damage -> 80 HP)
    const dmgEvent: DamageEvent = {
      attackId: 'LASER_999',
      attackerId: 'client_p2',
      defenderId: 'client_p1',
      targetId: 'client_p1',
      weapon: 'laser',
      weaponType: 'LASER',
      damage: 20,
      newHp: 80,
      serverTick: 25,
      timestamp: 2500
    };

    useMultiplayerStore.getState().handleDamageApplied(dmgEvent);
    expect(useMultiplayerStore.getState().selfState?.hp).toBe(80);
    expect(useMultiplayerStore.getState().lastAppliedServerTick).toBe(25);

    // A stale, out-of-order network snapshot arrives from serverTick 18 with old 100 HP
    const staleSnapshot18: GameSnapshot = {
      players: [
        {
          id: 'client_p1',
          name: 'P1',
          color: 'blue',
          position: [0, 15, 0],
          rotation: [0, 0, 0],
          velocity: [0, 0, 0],
          hp: 100, // old stale HP
          maxHp: 100,
          alive: true,
          throttle: 0,
          isBoosting: false
        },
        {
          id: 'client_p2',
          name: 'P2',
          color: 'red',
          position: [0, 15, 50],
          rotation: [0, Math.PI, 0],
          velocity: [0, 0, 0],
          hp: 100,
          maxHp: 100,
          alive: true,
          throttle: 0,
          isBoosting: false
        }
      ],
      projectiles: [],
      serverTick: 18, // Older than tick 25!
      timestamp: 1800,
      roomStatus: 'BATTLE'
    };

    useMultiplayerStore.getState().updateFromSnapshot(staleSnapshot18);

    // HP must NOT regress back to 100!
    expect(useMultiplayerStore.getState().selfState?.hp).toBe(80);
  });

  it('6. Combat debug telemetry and visual layer toggles function correctly', () => {
    const store = useMultiplayerStore.getState();

    expect(store.showCombatHitboxes).toBe(false);
    store.toggleCombatHitboxes();
    expect(useMultiplayerStore.getState().showCombatHitboxes).toBe(true);

    expect(store.showCombatTrajectories).toBe(false);
    store.toggleCombatTrajectories();
    expect(useMultiplayerStore.getState().showCombatTrajectories).toBe(true);

    expect(store.showCombatAimVector).toBe(false);
    store.toggleCombatAimVector();
    expect(useMultiplayerStore.getState().showCombatAimVector).toBe(true);

    // Verify telemetry logging
    const dmgEvent: DamageEvent = {
      attackId: 'BULLET_TEST_LOG',
      attackerId: 'p1',
      targetId: 'p2',
      weapon: 'bullet',
      weaponType: 'BULLET',
      damage: 10,
      newHp: 90,
      serverTick: 50,
      timestamp: Date.now()
    };

    store.handleDamageApplied(dmgEvent);
    const logs = useMultiplayerStore.getState().combatTelemetryLog;
    expect(logs.length).toBe(1);
    expect(logs[0].attackId).toBe('BULLET_TEST_LOG');
    expect(logs[0].damage).toBe(10);
    expect(logs[0].remainingHp).toBe(90);
    expect(logs[0].serverTick).toBe(50);
  });
});
