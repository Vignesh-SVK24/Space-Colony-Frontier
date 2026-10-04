import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client, Room } from '@colyseus/sdk';
import '../src/multiplayer/colyseusClient';

import { BattleStateSchema } from '../src/shared/schema/BattleState';

describe('Authoritative Colyseus 2-Client Combat Acceptance Tests', () => {
  let client1: Client;
  let client2: Client;
  let room1: Room;
  let room2: Room;

  beforeAll(async () => {
    client1 = new Client('ws://127.0.0.1:3001');
    client2 = new Client('ws://127.0.0.1:3001');
  });

  afterAll(() => {
    room1?.leave();
    room2?.leave();
  });

  it('1. should allow Client 1 to create a 6-character room and Client 2 to join with room code', async () => {
    room1 = await client1.create('battle', {
      playerName: 'Viper',
      playerColor: 'blue',
      mode: '1v1'
    }, BattleStateSchema);

    if (!room1.state.roomCode) {
      await new Promise<void>((resolve) => {
        room1.onStateChange.once(() => resolve());
      });
    }

    expect(room1).toBeDefined();
    expect(room1.state.roomCode).toHaveLength(6);

    room2 = await client2.joinById<BattleStateSchema>(room1.roomId, {
      playerName: 'Cobra',
      playerColor: 'red'
    }, BattleStateSchema);

    if (room2.state.players.size < 2) {
      await new Promise<void>((resolve) => {
        room2.onStateChange.once(() => resolve());
      });
    }

    await new Promise(r => setTimeout(r, 200));

    expect(room1.state.players.size).toBe(2);
    expect(room2.state.players.size).toBe(2);
  }, 10000);

  it('2. should countdown 3-2-1 and start match into BATTLE state with 250 HP base', async () => {
    const battlePromise = new Promise<void>((resolve) => {
      room1.onStateChange((state) => {
        if (state.roomStatus === 'BATTLE') {
          resolve();
        }
      });
    });

    room1.send('start_match');
    await battlePromise;

    expect(room1.state.roomStatus).toBe('BATTLE');
    expect(room2.state.roomStatus).toBe('BATTLE');

    const p1 = room1.state.players.get(room1.sessionId);
    const p2 = room1.state.players.get(room2.sessionId);

    expect(p1.hp).toBe(250);
    expect(p2.hp).toBe(250);
  }, 10000);

  it('3. should fire authoritative bullet (2 HP damage) reducing defender HP from 250 to 248', async () => {
    const p2InitialHp = room1.state.players.get(room2.sessionId).hp;
    expect(p2InitialHp).toBe(250);

    const damagePromise = new Promise<any>((resolve) => {
      room2.onMessage('damage_applied', (msg) => {
        if (msg.defenderId === room2.sessionId) {
          resolve(msg);
        }
      });
    });

    // P1 positions directly in front of P2 and shoots
    const p2Pos = room1.state.players.get(room2.sessionId).position;
    // Set P1 close to P2 facing P2
    room1.send('input', {
      position: [p2Pos.x, p2Pos.y, p2Pos.z - 20],
      rotation: [0, 0, 0],
      velocity: [0, 0, 0]
    });

    await new Promise(r => setTimeout(r, 100));

    // Fire bullet from P1 towards P2
    room1.send('fire_bullet', {
      origin: { x: p2Pos.x, y: p2Pos.y, z: p2Pos.z - 10 },
      direction: { x: 0, y: 0, z: 1 },
      attackId: 'test_bullet_hit_2hp'
    });

    const dmg = await damagePromise;
    expect(dmg.damage).toBe(2);
    expect(dmg.remainingHp).toBe(248);
    await new Promise(r => setTimeout(r, 80));
    expect(room1.state.players.get(room2.sessionId).hp).toBe(248);
  }, 10000);

  it('4. should fire authoritative laser beam (12 HP damage) reducing defender HP from 248 to 236', async () => {
    const p2Pos = room1.state.players.get(room2.sessionId).position;

    const damagePromise = new Promise<any>((resolve) => {
      room2.onMessage('damage_applied', (msg) => {
        if (msg.defenderId === room2.sessionId && msg.damage === 12) {
          resolve(msg);
        }
      });
    });

    room1.send('fire_laser', {
      origin: { x: p2Pos.x, y: p2Pos.y, z: p2Pos.z - 10 },
      direction: { x: 0, y: 0, z: 1 },
      attackId: 'test_laser_hit_12hp'
    });

    const dmg = await damagePromise;
    expect(dmg.damage).toBe(12);
    expect(dmg.remainingHp).toBe(236);
    await new Promise(r => setTimeout(r, 80));
    expect(room1.state.players.get(room2.sessionId).hp).toBe(236);
  }, 10000);

  it('5. should fire authoritative solar beam (30 HP damage) reducing defender HP from 236 to 206', async () => {
    const p2Pos = room1.state.players.get(room2.sessionId).position;

    const damagePromise = new Promise<any>((resolve) => {
      room2.onMessage('damage_applied', (msg) => {
        if (msg.defenderId === room2.sessionId && msg.damage === 30) {
          resolve(msg);
        }
      });
    });

    room1.send('fire_solar', {
      origin: { x: p2Pos.x, y: p2Pos.y, z: p2Pos.z - 10 },
      direction: { x: 0, y: 0, z: 1 },
      attackId: 'test_solar_hit_30hp'
    });

    const dmg = await damagePromise;
    expect(dmg.damage).toBe(30);
    expect(dmg.remainingHp).toBe(206);
    await new Promise(r => setTimeout(r, 80));
    expect(room1.state.players.get(room2.sessionId).hp).toBe(206);
  }, 10000);
});
