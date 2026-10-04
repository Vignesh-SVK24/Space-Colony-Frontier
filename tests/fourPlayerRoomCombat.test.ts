import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client, Room } from '@colyseus/sdk';
import '../src/multiplayer/colyseusClient';
import { BattleStateSchema } from '../src/shared/schema/BattleState';

describe('Authoritative Multiplayer 4-Player Room & Battle Royale Elimination Tests', () => {
  let client1: Client;
  let client2: Client;
  let client3: Client;
  let client4: Client;
  let client5: Client;

  let room1: Room<BattleStateSchema>;
  let room2: Room<BattleStateSchema>;
  let room3: Room<BattleStateSchema>;
  let room4: Room<BattleStateSchema>;

  beforeAll(async () => {
    client1 = new Client('ws://127.0.0.1:3001');
    client2 = new Client('ws://127.0.0.1:3001');
    client3 = new Client('ws://127.0.0.1:3001');
    client4 = new Client('ws://127.0.0.1:3001');
    client5 = new Client('ws://127.0.0.1:3001');
  });

  afterAll(() => {
    room1?.leave();
    room2?.leave();
    room3?.leave();
    room4?.leave();
  });

  it('1. should allow Client 1 to create FFA room and Clients 2, 3, and 4 to join same room', async () => {
    room1 = await client1.create<BattleStateSchema>('battle', {
      playerName: 'Pilot-Alpha',
      playerColor: 'yellow',
      mode: 'FFA'
    }, BattleStateSchema);

    if (!room1.state.roomCode) {
      await new Promise<void>((resolve) => {
        room1.onStateChange.once(() => resolve());
      });
    }

    expect(room1).toBeDefined();
    expect(room1.state.roomCode).toHaveLength(6);
    expect(room1.state.gameMode).toBe('FFA');

    // Client 2 joins the exact room
    room2 = await client2.joinById<BattleStateSchema>(room1.roomId, {
      playerName: 'Pilot-Beta',
      playerColor: 'blue'
    }, BattleStateSchema);

    // Client 3 joins
    room3 = await client3.joinById<BattleStateSchema>(room1.roomId, {
      playerName: 'Pilot-Gamma',
      playerColor: 'red'
    }, BattleStateSchema);

    // Client 4 joins
    room4 = await client4.joinById<BattleStateSchema>(room1.roomId, {
      playerName: 'Pilot-Delta',
      playerColor: 'green'
    }, BattleStateSchema);

    // Wait a brief tick for state synchronization
    await new Promise((r) => setTimeout(r, 200));

    expect(room1.state.players.size).toBe(4);
    expect(room2.state.players.size).toBe(4);
    expect(room3.state.players.size).toBe(4);
    expect(room4.state.players.size).toBe(4);

    const players = Array.from(room1.state.players.values());
    const colors = players.map(p => p.color);
    expect(new Set(colors).size).toBe(4);
  }, 10000);

  it('2. should reject a 5th player because room capacity is capped at 4', async () => {
    let errorCaught: any = null;
    try {
      await client5.joinById<BattleStateSchema>(room1.roomId, {
        playerName: 'Pilot-Echo',
        playerColor: 'purple'
      }, BattleStateSchema);
    } catch (err: any) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    // Colyseus throws MatchMakeError or error indicating room is full / locked
    expect(errorCaught.message || String(errorCaught)).toMatch(/full|locked|MatchMakeError|not allowed/i);
  });

  it('3. should verify 4-way balanced spawn locations with >=60m clearance', () => {
    const playersList = Array.from(room1.state.players.values());
    expect(playersList.length).toBe(4);

    // Verify distance between all pairs is >= 60m
    for (let i = 0; i < playersList.length; i++) {
      for (let j = i + 1; j < playersList.length; j++) {
        const p1 = playersList[i];
        const p2 = playersList[j];
        const dist = Math.hypot(
          p1.position.x - p2.position.x,
          p1.position.y - p2.position.y,
          p1.position.z - p2.position.z
        );
        expect(dist).toBeGreaterThanOrEqual(60);
      }
    }
  });

  it('4. should handle Battle Royale state and player status accurately', async () => {
    // Start match
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

    // All 4 players start with 250 HP base and alive = true
    const playersList = Array.from(room1.state.players.values());
    for (const p of playersList) {
      expect(p.hp).toBe(250);
      expect(p.alive).toBe(true);
    }
  }, 10000);
});
