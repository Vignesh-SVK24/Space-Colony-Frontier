import { io, Socket } from 'socket.io-client';
import {
  PlayerInput,
  BattleColor,
  PlayerState,
  ProjectileState,
  GameSnapshot,
  DamageEvent,
  LaserEvent,
  MatchStats
} from './types';
import { useMultiplayerStore } from './useMultiplayerStore';
import { nexusAudio } from '../utils/nexusAudio';

let socket: Socket | null = null;

export const connectToServer = () => {
  if (socket?.connected) return;
  
  const targetUrl = useMultiplayerStore.getState().serverUrl || `http://${(typeof window !== 'undefined' && window.location.hostname) || 'localhost'}:3001`;
  socket = io(targetUrl, {
    autoConnect: true,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    useMultiplayerStore.getState().setConnectionQuality('good');
    useMultiplayerStore.getState().setError(null);
    if (socket?.id) {
      useMultiplayerStore.getState().setPlayerId(socket.id);
    }
  });

  socket.on('disconnect', () => {
    useMultiplayerStore.getState().setConnectionQuality('disconnected');
  });

  socket.on('connect_error', () => {
    useMultiplayerStore.getState().setError(`Failed to connect to battle server at ${targetUrl}`);
    useMultiplayerStore.getState().setConnectionQuality('disconnected');
  });

  socket.on('room_created', (data: { roomCode: string; playerId: string; playerColor?: BattleColor; players?: any[] }) => {
    useMultiplayerStore.getState().setRoomCode(data.roomCode);
    useMultiplayerStore.getState().setPlayerId(data.playerId);
    useMultiplayerStore.getState().setIsHost(true);
    useMultiplayerStore.getState().setRoomStatus('WAITING');
    useMultiplayerStore.getState().setAppView('LOBBY');
    if (data.players && Array.isArray(data.players)) {
      useMultiplayerStore.getState().setRoomPlayers(data.players);
    }
  });

  socket.on('room_joined', (data: any) => {
    const state = useMultiplayerStore.getState();
    const roomInfo = data?.roomInfo || data;
    const players: any[] = Array.isArray(roomInfo?.players) 
      ? roomInfo.players 
      : Object.values(roomInfo?.players || {});
    
    useMultiplayerStore.getState().setRoomPlayers(players);
    const opponent = players.find(p => p.id !== state.playerId);
    if (opponent) {
      useMultiplayerStore.getState().setOpponentInfo(opponent.name, opponent.color);
    }
    
    useMultiplayerStore.getState().setRoomStatus(roomInfo?.status || 'WAITING');
    useMultiplayerStore.getState().setRoomCode(roomInfo?.code || state.roomCode);
    useMultiplayerStore.getState().setAppView('LOBBY');
  });

  socket.on('room_players_updated', (data: { players: any[] }) => {
    if (Array.isArray(data?.players)) {
      useMultiplayerStore.getState().setRoomPlayers(data.players);
      const myId = useMultiplayerStore.getState().playerId;
      const opponent = data.players.find((p: any) => p.id !== myId);
      if (opponent) {
        useMultiplayerStore.getState().setOpponentInfo(opponent.name, opponent.color);
      }
    }
  });

  socket.on('player_joined', (player: { playerName?: string; name?: string; playerColor?: BattleColor; color?: BattleColor }) => {
    const name = player.playerName || player.name || 'Opponent';
    const color = player.playerColor || player.color || 'blue';
    useMultiplayerStore.getState().setOpponentInfo(name, color);
  });

  socket.on('player_left', (data?: any) => {
    if (data?.players && Array.isArray(data.players)) {
      useMultiplayerStore.getState().setRoomPlayers(data.players);
      const myId = useMultiplayerStore.getState().playerId;
      const opponent = data.players.find((p: any) => p.id !== myId);
      if (opponent) {
        useMultiplayerStore.getState().setOpponentInfo(opponent.name, opponent.color);
      } else {
        useMultiplayerStore.getState().setOpponentInfo('', null);
      }
    } else {
      useMultiplayerStore.getState().setOpponentInfo('', null);
      useMultiplayerStore.getState().setRoomStatus('WAITING');
      useMultiplayerStore.getState().setError('A pilot left the match');
    }
  });

  socket.on('opponent_disconnected', () => {
    useMultiplayerStore.getState().setOpponentInfo('', null);
    useMultiplayerStore.getState().setRoomStatus('WAITING');
    useMultiplayerStore.getState().setError('Opponent disconnected');
  });

  socket.on('countdown', (data: any) => {
    const count = typeof data === 'number' ? data : (data?.seconds ?? null);
    useMultiplayerStore.getState().setCountdown(count);
    if (count !== null && count > 0) {
      useMultiplayerStore.getState().setRoomStatus('COUNTDOWN');
    } else if (count === 0) {
      useMultiplayerStore.getState().setAppView('BATTLE');
      useMultiplayerStore.getState().setRoomStatus('BATTLE');
      useMultiplayerStore.getState().setCountdown(null);
    }
  });

  socket.on('match_start', () => {
    useMultiplayerStore.getState().setAppView('BATTLE');
    useMultiplayerStore.getState().setRoomStatus('BATTLE');
    useMultiplayerStore.getState().setCountdown(null);
  });

  const handleStateUpdate = (raw: any) => {
    if (!raw) return;
    
    const rawPlayers = raw.players || {};
    const playerEntries: any[] = Array.isArray(rawPlayers) ? rawPlayers : Object.values(rawPlayers);
    
    const players: PlayerState[] = playerEntries.map((p: any) => ({
      id: p.id || '',
      name: p.name || 'Pilot',
      color: (p.color || 'yellow') as BattleColor,
      position: Array.isArray(p.position) 
        ? p.position 
        : [p.position?.x ?? 0, p.position?.y ?? 0, p.position?.z ?? 0],
      rotation: Array.isArray(p.rotation) 
        ? p.rotation 
        : [p.rotation?.x ?? 0, p.rotation?.y ?? 0, p.rotation?.z ?? 0],
      velocity: Array.isArray(p.velocity) 
        ? p.velocity 
        : [p.velocity?.x ?? 0, p.velocity?.y ?? 0, p.velocity?.z ?? 0],
      hp: typeof p.hp === 'number' ? p.hp : 100,
      maxHp: 100,
      alive: (p.hp ?? 100) > 0,
      throttle: typeof p.throttle === 'number' ? p.throttle : Math.abs(p.lastInput?.thrust ?? 0),
      isBoosting: !!(p.isBoosting || p.lastInput?.boost)
    }));

    const rawProjectiles: any[] = raw.projectiles || [];
    const projectiles: ProjectileState[] = rawProjectiles.map((pr: any) => {
      const shooter = playerEntries.find(p => p.id === pr.shooterId || p.id === pr.ownerId);
      return {
        id: pr.id || Math.random().toString(),
        ownerId: pr.shooterId || pr.ownerId || '',
        position: Array.isArray(pr.position) 
          ? pr.position 
          : [pr.position?.x ?? 0, pr.position?.y ?? 0, pr.position?.z ?? 0],
        direction: Array.isArray(pr.velocity) 
          ? pr.velocity 
          : [pr.velocity?.x ?? 0, pr.velocity?.y ?? 0, pr.velocity?.z ?? 1],
        color: (shooter?.color || 'yellow') as BattleColor,
        createdAt: pr.spawnTime || pr.createdAt || Date.now()
      };
    });

    const snapshot: GameSnapshot = {
      players,
      projectiles,
      serverTick: raw.serverTick,
      timestamp: raw.timestamp || Date.now(),
      roomStatus: raw.roomStatus || useMultiplayerStore.getState().roomStatus
    };

    useMultiplayerStore.getState().updateFromSnapshot(snapshot);
  };

  socket.on('game_state', handleStateUpdate);
  socket.on('game_snapshot', handleStateUpdate);

  // Authoritative Laser Fired Broadcast
  socket.on('laser_fired', (data: LaserEvent) => {
    useMultiplayerStore.getState().setActiveLaserBeam(data);
    nexusAudio.playLaser();
  });

  socket.on('laser_cooldown', (data: { remaining: string }) => {
    useMultiplayerStore.getState().setLaserCooldownRemaining(parseFloat(data.remaining));
  });

  // Authoritative Damage Event with tick sequence tracking
  const onDamageApplied = (event: DamageEvent) => {
    useMultiplayerStore.getState().handleDamageApplied(event);
    const myId = useMultiplayerStore.getState().playerId;
    if (event.targetId === myId) {
      nexusAudio.playWarning();
    } else if (event.attackerId === myId) {
      nexusAudio.playHit();
    }
  };

  socket.on('player_hit', onDamageApplied);
  socket.on('damage_applied', onDamageApplied);
  socket.on('DAMAGE_APPLIED', onDamageApplied);

  socket.on('player_eliminated', () => {
    nexusAudio.playExplosion();
  });

  socket.on('match_end', (data: any) => {
    const myId = useMultiplayerStore.getState().playerId;
    const isWinner = data.winnerId === myId;
    const stats: MatchStats = {
      winner: data.winnerId || data.winner || '',
      winnerName: data.winnerName || (isWinner ? useMultiplayerStore.getState().playerName : useMultiplayerStore.getState().opponentName),
      loserName: isWinner ? useMultiplayerStore.getState().opponentName : useMultiplayerStore.getState().playerName,
      damageDealt: data.stats?.damageDealt ?? 100,
      shotsHit: data.stats?.shotsHit ?? 10,
      shotsFired: data.stats?.shotsFired ?? 15,
      accuracy: data.stats?.accuracy ?? 67,
      matchDuration: data.stats?.matchDuration ?? 45
    };
    useMultiplayerStore.getState().handleMatchEnd(stats);
    if (isWinner) {
      nexusAudio.playVictory();
    } else {
      nexusAudio.playDefeat();
    }
  });

  // Rematch started
  socket.on('rematch_started', () => {
    useMultiplayerStore.getState().handleRematchReset();
  });

  socket.on('error', (data: any) => {
    const message = typeof data === 'string' ? data : (data?.message || 'Server error');
    useMultiplayerStore.getState().setError(message);
  });
};

export const createRoom = (name: string, color: BattleColor) => {
  connectToServer();
  socket?.emit('create_room', { playerName: name, playerColor: color });
};

export const joinRoom = (code: string, name: string, color: BattleColor) => {
  connectToServer();
  socket?.emit('join_room', { roomCode: code, playerName: name, playerColor: color });
};

export const sendInput = (input: PlayerInput) => {
  if (useMultiplayerStore.getState().roomStatus === 'BATTLE') {
    socket?.emit('player_input', input);
  }
};

export const sendShoot = (origin?: [number, number, number], direction?: [number, number, number], attackId?: string) => {
  if (useMultiplayerStore.getState().roomStatus === 'BATTLE') {
    const finalAttackId = attackId || `BULLET_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const payload = {
      origin: origin ? { x: origin[0], y: origin[1], z: origin[2] } : undefined,
      direction: direction ? { x: direction[0], y: direction[1], z: direction[2] } : undefined,
      attackId: finalAttackId
    };
    socket?.emit('shoot', payload);
    socket?.emit('fire_bullet', payload);
  }
};

export const sendLaser = (origin?: [number, number, number], direction?: [number, number, number], attackId?: string) => {
  if (useMultiplayerStore.getState().roomStatus === 'BATTLE') {
    const finalAttackId = attackId || `LASER_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const payload = {
      origin: origin ? { x: origin[0], y: origin[1], z: origin[2] } : undefined,
      direction: direction ? { x: direction[0], y: direction[1], z: direction[2] } : undefined,
      attackId: finalAttackId
    };
    socket?.emit('fire_laser', payload);
  }
};

export const startMatch = () => {
  socket?.emit('start_match');
};

export const updateServerUrl = (url: string) => {
  useMultiplayerStore.getState().setServerUrl(url);
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectToServer();
};

export const requestRematch = () => {
  socket?.emit('request_rematch');
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const socketClient = {
  connectToServer,
  updateServerUrl,
  createRoom,
  joinRoom,
  startMatch,
  sendInput,
  sendShoot,
  sendLaser,
  requestRematch,
  disconnect
};
