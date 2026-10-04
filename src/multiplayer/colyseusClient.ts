import { Client, Room } from '@colyseus/sdk';
import {
  BattleColor,
  GameMode,
  PlayerState,
  Team
} from './types';
import { useMultiplayerStore } from './useMultiplayerStore';
import { nexusAudio } from '../utils/nexusAudio';
import { GAME_CONFIG } from '../shared/gameConfig';
import { BattleStateSchema } from '../shared/schema/BattleState';

export { BattleStateSchema };

let client: Client | null = null;
let currentRoom: Room | null = null;

export const formatConnectionError = (err: any, endpoint: string): string => {
  const rawMsg = err?.message || String(err || '');
  const isFetchError = rawMsg.toLowerCase().includes('failed to fetch') || 
                       rawMsg.toLowerCase().includes('networkerror') ||
                       rawMsg.toLowerCase().includes('load failed') ||
                       rawMsg.toLowerCase().includes('network error') ||
                       err?.name === 'TypeError' ||
                       err?.code === 'ECONNREFUSED';

  if (isFetchError) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isLocal = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

    if (isHttps && isLocal) {
      return `Cannot connect to local server (${endpoint}) from an HTTPS website due to browser Mixed Content security. Run the game locally on http://localhost:5173, or host the Colyseus backend with HTTPS/WSS (e.g. on Render/Fly.io) and configure the server URL.`;
    }

    if (isLocal) {
      return `Cannot reach game server at ${endpoint}. Make sure the Colyseus backend server is running on port 3001 (run 'npm run server' or 'cd server && npm run dev').`;
    }

    return `Cannot reach multiplayer server at ${endpoint}. If playing online, please ensure the backend is deployed and active, or configure a custom server URL in Server Settings.`;
  }

  return rawMsg || 'Failed to connect to multiplayer server. Please verify your connection.';
};

const getColyseusEndpoint = (): string => {
  const customUrl = useMultiplayerStore.getState().serverUrl;
  if (customUrl && customUrl.trim()) {
    let clean = customUrl.trim().replace(/\/+$/, '');
    if (clean.startsWith('http://')) {
      return clean.replace(/^http:/, 'ws:');
    }
    if (clean.startsWith('https://')) {
      return clean.replace(/^https:/, 'wss:');
    }
    if (!clean.startsWith('ws://') && !clean.startsWith('wss://')) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      return `${isHttps ? 'wss' : 'ws'}://${clean}`;
    }
    return clean;
  }
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const host = (typeof window !== 'undefined' && window.location.hostname) || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (isLocal) {
    return 'ws://localhost:3001';
  }
  return 'wss://space-colony-frontier.onrender.com';
};

export const getClient = (): Client => {
  const endpoint = getColyseusEndpoint();
  if (!client) {
    client = new Client(endpoint);
  }
  return client;
};

export const updateServerUrl = (url: string) => {
  useMultiplayerStore.getState().setServerUrl(url);
  try {
    localStorage.setItem('sfc_server_url', url);
  } catch {}
  let clean = url.trim().replace(/\/+$/, '');
  if (clean.startsWith('http://')) clean = clean.replace(/^http:/, 'ws:');
  else if (clean.startsWith('https://')) clean = clean.replace(/^https:/, 'wss:');
  client = new Client(clean);
};

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createRoom = async (playerName: string, playerColor: BattleColor, mode: GameMode = '1v1', customRoomCode?: string): Promise<boolean> => {
  const endpoint = getColyseusEndpoint();
  const roomCode = (customRoomCode || generateRoomCode()).trim().toUpperCase();
  try {
    useMultiplayerStore.getState().setError(null);
    useMultiplayerStore.getState().setConnectionQuality('connecting');
    useMultiplayerStore.getState().setRoomCode(roomCode);

    const colyseusClient = new Client(endpoint);
    client = colyseusClient;

    const createPromise = colyseusClient.create('battle', {
      roomCode,
      playerName,
      playerColor,
      mode
    }, BattleStateSchema);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out. The server may be spinning up or unreachable.')), 15000)
    );

    currentRoom = await Promise.race([createPromise, timeoutPromise]);

    bindRoomEvents(currentRoom);

    useMultiplayerStore.getState().setRoomCode(roomCode);
    useMultiplayerStore.getState().setPlayerId(currentRoom.sessionId);
    useMultiplayerStore.getState().setIsHost(true);
    useMultiplayerStore.getState().setGameMode(mode);
    useMultiplayerStore.getState().setRoomStatus('LOBBY');
    useMultiplayerStore.getState().setAppView('LOBBY');
    useMultiplayerStore.getState().setConnectionQuality('good');
    useMultiplayerStore.getState().setError(null);
    return true;
  } catch (err: any) {
    console.error('Failed to create Colyseus room:', err);
    const friendlyError = formatConnectionError(err, endpoint);
    useMultiplayerStore.getState().setError(friendlyError);
    useMultiplayerStore.getState().setConnectionQuality('disconnected');
    return false;
  }
};

export const joinRoom = async (roomCode: string, playerName: string, playerColor: BattleColor): Promise<boolean> => {
  const endpoint = getColyseusEndpoint();
  const cleanCode = roomCode.trim().toUpperCase();
  try {
    useMultiplayerStore.getState().setError(null);
    useMultiplayerStore.getState().setConnectionQuality('connecting');

    const colyseusClient = new Client(endpoint);
    client = colyseusClient;

    const joinPromise = colyseusClient.join('battle', {
      roomCode: cleanCode,
      playerName,
      playerColor
    }, BattleStateSchema);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out. The server may be spinning up or unreachable.')), 15000)
    );

    currentRoom = await Promise.race([joinPromise, timeoutPromise]);

    bindRoomEvents(currentRoom);

    useMultiplayerStore.getState().setRoomCode(cleanCode);
    useMultiplayerStore.getState().setPlayerId(currentRoom.sessionId);
    useMultiplayerStore.getState().setIsHost(false);
    useMultiplayerStore.getState().setRoomStatus('LOBBY');
    useMultiplayerStore.getState().setAppView('LOBBY');
    useMultiplayerStore.getState().setConnectionQuality('good');
    useMultiplayerStore.getState().setError(null);
    return true;
  } catch (err: any) {
    console.error('Failed to join Colyseus room:', err);
    let friendlyError = formatConnectionError(err, endpoint);
    const rawMsg = err?.message || String(err || '');
    if (rawMsg.toLowerCase().includes('no rooms found') || rawMsg.toLowerCase().includes('not found') || err?.code === 4212) {
      friendlyError = `Room "${cleanCode}" was not found or is already full. Please verify the code with the host.`;
    }
    useMultiplayerStore.getState().setError(friendlyError);
    useMultiplayerStore.getState().setConnectionQuality('disconnected');
    return false;
  }
};

const bindRoomEvents = (room: Room) => {
  // Sync state changes from authoritative Colyseus room
  room.onStateChange((state: any) => {
    const store = useMultiplayerStore.getState();

    store.setRoomCode(state.roomCode);
    store.setRoomStatus(state.roomStatus);
    store.setGameMode(state.gameMode);
    store.setCountdown(state.countdown > 0 ? Math.ceil(state.countdown) : null);

    const playersList: any[] = [];
    let selfFound: any = null;
    let opponents: any[] = [];

    state.players.forEach((p: any, sessionId: string) => {
      const playerObj: PlayerState = {
        id: sessionId,
        sessionId: sessionId,
        name: p.name,
        color: p.color,
        team: p.team || 'NONE',
        slot: p.slot || 1,
        position: [p.position.x, p.position.y, p.position.z],
        rotation: [p.rotation.x, p.rotation.y, p.rotation.z],
        velocity: [p.velocity.x, p.velocity.y, p.velocity.z],
        hp: p.hp,
        maxHp: p.maxHp || 250,
        alive: p.alive,
        ready: p.ready,
        isHost: p.isHost,
        throttle: 0,
        isBoosting: false,
        ammo: p.ammo,
        isReloading: p.isReloading,
        reloadTimeRemaining: p.reloadTimeRemaining,
        laserCooldownRemaining: p.laserCooldownRemaining,
        solarCooldownRemaining: p.solarCooldownRemaining
      };

      playersList.push({
        id: sessionId,
        name: p.name,
        color: p.color,
        team: p.team,
        slot: p.slot,
        isHost: p.isHost,
        ready: p.ready
      });

      if (sessionId === room.sessionId) {
        selfFound = playerObj;
      } else {
        opponents.push(playerObj);
      }
    });

    store.setRoomPlayers(playersList);
    if (selfFound) {
      store.setSelfState(selfFound);
      store.setIsHost(selfFound.isHost);
    }
    store.setOtherPlayers(opponents);
    if (opponents.length > 0) {
      store.setOpponentState(opponents[0]);
      store.setOpponentInfo(opponents[0].name, opponents[0].color);
    }

    if (state.roomStatus === 'BATTLE' && store.appView !== 'BATTLE') {
      store.setAppView('BATTLE');
    }
  });

  // Authoritative damage event
  room.onMessage('damage_applied', (data: any) => {
    const store = useMultiplayerStore.getState();
    store.handleDamageApplied({
      attackId: data.attackId,
      targetId: data.defenderId,
      attackerId: data.attackerId,
      defenderId: data.defenderId,
      damage: data.damage,
      newHp: data.remainingHp,
      remainingHp: data.remainingHp,
      weapon: data.weaponType?.toLowerCase() || 'bullet',
      weaponType: data.weaponType || 'BULLET',
      timestamp: Date.now()
    });

    if (data.attackerId === room.sessionId) {
      nexusAudio.playHit();
    }
  });

  // Authoritative bullet spawn
  room.onMessage('bullet_spawned', (data: any) => {
    const store = useMultiplayerStore.getState();
    store.addProjectile({
      id: data.id,
      attackId: data.attackId,
      ownerId: data.ownerId,
      weaponType: 'BULLET',
      position: data.position,
      direction: data.direction,
      color: data.color,
      team: data.team,
      speed: GAME_CONFIG.BULLET_SPEED,
      damage: GAME_CONFIG.BULLET_DAMAGE,
      createdAt: Date.now()
    });
  });

  // Authoritative laser fired
  room.onMessage('laser_fired', (data: any) => {
    const store = useMultiplayerStore.getState();
    const shooter = store.otherPlayers.find(p => p.id === data.shooterId) || (store.selfState?.id === data.shooterId ? store.selfState : null);
    store.setActiveLaserBeam({
      attackId: data.attackId,
      shooterId: data.shooterId,
      start: data.start,
      end: data.end,
      blocked: data.blocked,
      hitTargetId: data.hitTargetId,
      color: shooter ? shooter.color : 'blue',
      damage: data.damage,
      weaponType: 'LASER',
      timestamp: Date.now()
    });
    nexusAudio.playLaser();
  });

  // Authoritative solar beam fired
  room.onMessage('solar_fired', (data: any) => {
    const store = useMultiplayerStore.getState();
    const shooter = store.otherPlayers.find(p => p.id === data.shooterId) || (store.selfState?.id === data.shooterId ? store.selfState : null);
    store.setActiveSolarBeam({
      attackId: data.attackId,
      shooterId: data.shooterId,
      start: data.start,
      end: data.end,
      blocked: data.blocked,
      hitTargetId: data.hitTargetId,
      color: shooter ? shooter.color : 'yellow',
      damage: data.damage,
      weaponType: 'SOLAR_BEAM',
      timestamp: Date.now()
    });
    nexusAudio.playLaser();
  });

  // Match ended
  room.onMessage('match_ended', (data: any) => {
    const store = useMultiplayerStore.getState();
    store.handleMatchEnd({
      winner: data.winnerId,
      winnerName: data.winnerName,
      winnerTeam: data.winnerTeam,
      loserName: store.opponentName || 'Enemy',
      mode: store.gameMode,
      damageDealt: store.selfState ? (250 - (store.opponentState?.hp ?? 250)) : 0,
      shotsHit: 0,
      shotsFired: 0,
      accuracy: 0,
      matchDuration: 60
    });
  });

  room.onMessage('rematch_accepted', () => {
    useMultiplayerStore.getState().setAppView('LOBBY');
  });

  room.onLeave((code) => {
    console.log(`Left room with code: ${code}`);
    useMultiplayerStore.getState().setConnectionQuality('disconnected');
  });
};

export const sendInput = (position: [number, number, number], rotation: [number, number, number], velocity: [number, number, number]) => {
  if (currentRoom) {
    currentRoom.send('input', { position, rotation, velocity });
  }
};

export const sendBullet = (origin: [number, number, number], direction: [number, number, number], attackId?: string) => {
  if (currentRoom) {
    currentRoom.send('fire_bullet', {
      origin: { x: origin[0], y: origin[1], z: origin[2] },
      direction: { x: direction[0], y: direction[1], z: direction[2] },
      attackId
    });
  }
};

export const sendLaser = (origin: [number, number, number], direction: [number, number, number], attackId?: string) => {
  if (currentRoom) {
    currentRoom.send('fire_laser', {
      origin: { x: origin[0], y: origin[1], z: origin[2] },
      direction: { x: direction[0], y: direction[1], z: direction[2] },
      attackId
    });
  }
};

export const sendSolar = (origin: [number, number, number], direction: [number, number, number], attackId?: string) => {
  if (currentRoom) {
    currentRoom.send('fire_solar', {
      origin: { x: origin[0], y: origin[1], z: origin[2] },
      direction: { x: direction[0], y: direction[1], z: direction[2] },
      attackId
    });
  }
};

export const sendReload = () => {
  if (currentRoom) {
    currentRoom.send('reload');
  }
};

export const sendSetTeam = (team: Team) => {
  if (currentRoom) {
    currentRoom.send('set_team', { team });
  }
};

export const startMatch = () => {
  if (currentRoom) {
    currentRoom.send('start_match');
  }
};

export const requestRematch = () => {
  if (currentRoom) {
    currentRoom.send('request_rematch');
  }
};

export const disconnect = () => {
  if (currentRoom) {
    currentRoom.leave();
    currentRoom = null;
  }
};
