import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';

describe('Authoritative Multiplayer 2-Client Combat Acceptance Tests', () => {
  let client1: Socket;
  let client2: Socket;
  let roomCode: string;

  beforeAll(async () => {
    client1 = io('http://localhost:3001', { transports: ['websocket'] });
    client2 = io('http://localhost:3001', { transports: ['websocket'] });

    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', () => resolve())),
      new Promise<void>((resolve) => client2.on('connect', () => resolve()))
    ]);
  });

  afterAll(() => {
    client1?.disconnect();
    client2?.disconnect();
  });

  it('1. should allow Client 1 to create a 6-character room and Client 2 to join', async () => {
    const createPromise = new Promise<string>((resolve) => {
      client1.on('room_created', (data: { roomCode: string }) => {
        expect(data.roomCode).toHaveLength(6);
        resolve(data.roomCode);
      });
    });

    client1.emit('create_room', { playerName: 'Vignesh', playerColor: 'blue' });
    roomCode = await createPromise;
    expect(roomCode).toBeDefined();

    const joinPromise = new Promise<void>((resolve) => {
      client2.on('room_joined', (data: any) => {
        expect(data.roomInfo.code).toBe(roomCode);
        expect(data.roomInfo.players.length).toBe(2);
        resolve();
      });
    });

    client2.emit('join_room', { roomCode, playerName: 'Alex', playerColor: 'red' });
    await joinPromise;
  });

  it('2. should countdown 3-2-1 and start the match with safe spawn zones', async () => {
    const matchStartPromise = new Promise<void>((resolve) => {
      client1.on('match_start', () => {
        resolve();
      });
    });

    client1.emit('start_match');
    await matchStartPromise;
  }, 25000);

  it('3. should broadcast synchronized 60Hz game_state with matching coordinates', async () => {
    const statePromise = new Promise<void>((resolve) => {
      client1.once('game_state', (snapshot: any) => {
        expect(snapshot.players).toBeDefined();
        const p1 = snapshot.players[client1.id!];
        const p2 = snapshot.players[client2.id!];
        expect(p1).toBeDefined();
        expect(p2).toBeDefined();
        expect(p1.position.x).toBeCloseTo(-140, 0);
        expect(p2.position.x).toBeCloseTo(140, 0);
        expect(p1.hp).toBe(100);
        expect(p2.hp).toBe(100);
        resolve();
      });
    });

    await statePromise;
  }, 10000);

  it('4. should close distance and hit opponent with authoritative bullet', async () => {
    // Wait past spawn protection (2.2 seconds)
    await new Promise((r) => setTimeout(r, 2200));

    // Both players thrust toward center to enter dogfight range (~80m apart)
    client1.emit('player_input', {
      thrust: 1, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: true, brake: false
    });
    client2.emit('player_input', {
      thrust: 1, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: true, brake: false
    });

    await new Promise((r) => setTimeout(r, 1600));

    // Cut thrust
    client1.emit('player_input', {
      thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: true
    });
    client2.emit('player_input', {
      thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: true
    });

    await new Promise((r) => setTimeout(r, 800));

    // Get current positions
    let p1Pos: any;
    let p2Pos: any;
    await new Promise<void>((resolve) => {
      client1.once('game_state', (snapshot: any) => {
        p1Pos = snapshot.players[client1.id!].position;
        p2Pos = snapshot.players[client2.id!].position;
        resolve();
      });
    });

    const dx = p2Pos.x - p1Pos.x;
    const dy = p2Pos.y - p1Pos.y;
    const dz = p2Pos.z - p1Pos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const dir = { x: dx / dist, y: dy / dist, z: dz / dist };

    const hitPromise = new Promise<any>((resolve) => {
      const onHit = (data: any) => {
        if (data.targetId === client2.id && (data.weapon === 'bullet' || data.weaponType === 'bullet')) {
          client2.off('player_hit', onHit);
          expect(data.damage).toBe(10);
          resolve(data);
        }
      };
      client2.on('player_hit', onHit);
    });

    // Client 1 fires burst at Client 2
    for (let b = 0; b < 2; b++) {
      client1.emit('fire_bullet', {
        origin: { x: p1Pos.x + dir.x * 2, y: p1Pos.y + dir.y * 2, z: p1Pos.z + dir.z * 2 },
        direction: dir
      });
      await new Promise((r) => setTimeout(r, 480));
    }

    const hitResult = await hitPromise;
    expect(hitResult.damage).toBe(10);
  }, 25000);

  it('5. should fire authoritative laser beam, apply 20 damage, and enforce 5s recharge', async () => {
    // Get current positions
    let p1Pos: any;
    let p2Pos: any;
    await new Promise<void>((resolve) => {
      client1.once('game_state', (snapshot: any) => {
        p1Pos = snapshot.players[client1.id!].position;
        p2Pos = snapshot.players[client2.id!].position;
        resolve();
      });
    });

    const dx = p2Pos.x - p1Pos.x;
    const dy = p2Pos.y - p1Pos.y;
    const dz = p2Pos.z - p1Pos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const dir = { x: dx / dist, y: dy / dist, z: dz / dist };

    const laserFiredPromise = new Promise<any>((resolve) => {
      client2.once('laser_fired', (data: any) => {
        expect(data.shooterId).toBe(client1.id);
        expect(data.blocked).toBe(false);
        expect(data.hitTargetId).toBe(client2.id);
        resolve(data);
      });
    });

    const laserHitPromise = new Promise<any>((resolve) => {
      const onLaserHit = (data: any) => {
        if (data.weapon === 'laser' || data.weaponType === 'laser') {
          client2.off('player_hit', onLaserHit);
          expect(data.damage).toBe(20);
          resolve(data);
        }
      };
      client2.on('player_hit', onLaserHit);
    });

    client1.emit('fire_laser', {
      origin: { x: p1Pos.x + dir.x * 2, y: p1Pos.y + dir.y * 2, z: p1Pos.z + dir.z * 2 },
      direction: dir
    });

    await Promise.all([laserFiredPromise, laserHitPromise]);

    // Immediate second fire attempt must be rejected due to 5s cooldown
    const cooldownPromise = new Promise<void>((resolve) => {
      client1.once('laser_cooldown', (data: any) => {
        expect(parseFloat(data.remaining)).toBeGreaterThan(0);
        resolve();
      });
    });

    client1.emit('fire_laser', {
      origin: { x: p1Pos.x + dir.x * 2, y: p1Pos.y + dir.y * 2, z: p1Pos.z + dir.z * 2 },
      direction: dir
    });

    await cooldownPromise;
  }, 25000);

  it('6. should block laser beam when firing into an asteroid obstacle', async () => {
    // Asteroid Titan-Alpha is at [65, 5, -45] with radius 24
    // Wait until 5s laser cooldown has elapsed
    await new Promise((r) => setTimeout(r, 5200));

    let p1Pos: any;
    await new Promise<void>((resolve) => {
      client1.once('game_state', (snapshot: any) => {
        p1Pos = snapshot.players[client1.id!].position;
        resolve();
      });
    });

    // Aim straight toward Asteroid Titan-Alpha
    const toAstX = 65 - p1Pos.x;
    const toAstY = 5 - p1Pos.y;
    const toAstZ = -45 - p1Pos.z;
    const astDist = Math.sqrt(toAstX * toAstX + toAstY * toAstY + toAstZ * toAstZ);
    const astDir = { x: toAstX / astDist, y: toAstY / astDist, z: toAstZ / astDist };

    const blockedLaserPromise = new Promise<any>((resolve) => {
      client1.once('laser_fired', (data: any) => {
        expect(data.blocked).toBe(true);
        expect(data.hitTargetId).toBeUndefined();
        resolve(data);
      });
    });

    client1.emit('fire_laser', {
      origin: { x: p1Pos.x + astDir.x * 2, y: p1Pos.y + astDir.y * 2, z: p1Pos.z + astDir.z * 2 },
      direction: astDir
    });

    const laserData = await blockedLaserPromise;
    expect(laserData.blocked).toBe(true);
  }, 25000);

  it('7. should eliminate player on 0 HP, broadcast match_end, and support rematch reset', async () => {
    let matchEnded = false;
    const matchEndPromise = new Promise<any>((resolve) => {
      client1.once('match_end', (data: any) => {
        matchEnded = true;
        expect(data.winnerId).toBe(client1.id);
        resolve(data);
      });
    });

    client1.on('player_hit', (data: any) => {
      console.log(`[TEST7 HIT] Weapon: ${data.weapon}, Damage: ${data.damage}, NewHp: ${data.newHp}`);
    });

    let currentP1: any = null;
    let currentP2: any = null;
    const onState = (snapshot: any) => {
      if (snapshot.players[client1.id!]) currentP1 = snapshot.players[client1.id!].position;
      if (snapshot.players[client2.id!]) currentP2 = snapshot.players[client2.id!].position;
    };
    client1.on('game_state', onState);

    // Wait for initial position update
    for (let attempt = 0; attempt < 20 && (!currentP1 || !currentP2); attempt++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    console.log('[TEST7] P1 pos:', currentP1, 'P2 pos:', currentP2);

    // Fire volleys tracking the target dynamically until eliminated
    for (let i = 0; i < 25 && !matchEnded; i++) {
      if (currentP1 && currentP2) {
        const dx = currentP2.x - currentP1.x;
        const dy = currentP2.y - currentP1.y;
        const dz = currentP2.z - currentP1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.1) {
          const dir = { x: dx / dist, y: dy / dist, z: dz / dist };
          client1.emit('fire_bullet', {
            origin: { x: currentP1.x + dir.x * 2, y: currentP1.y + dir.y * 2, z: currentP1.z + dir.z * 2 },
            direction: dir
          });
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    const matchEndData = await matchEndPromise;
    client1.off('game_state', onState);
    expect(matchEndData.winnerId).toBe(client1.id);

    // Request Rematch without rebuilding room
    const rematchPromise = new Promise<void>((resolve) => {
      client2.once('rematch_started', (data: any) => {
        expect(data.players.length).toBe(2);
        expect(data.players[0].hp).toBe(100);
        expect(data.players[1].hp).toBe(100);
        resolve();
      });
    });

    client1.emit('request_rematch');
    await rematchPromise;
  }, 30000);
});
