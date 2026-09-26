import { create } from 'zustand';
import { AppView, BattleColor, RoomStatus, GameSnapshot, PlayerState, ProjectileState, MatchStats } from './types';

interface MultiplayerState {
  appView: AppView;
  playerName: string;
  playerColor: BattleColor;
  roomCode: string;
  roomStatus: RoomStatus;
  playerId: string;
  isHost: boolean;
  isSolo: boolean;
  opponentName: string;
  opponentColor: BattleColor | null;
  selfState: PlayerState | null;
  opponentState: PlayerState | null;
  projectiles: ProjectileState[];
  matchResult: MatchStats | null;
  connectionQuality: 'good' | 'fair' | 'poor' | 'disconnected';
  countdown: number | null;
  error: string | null;

  snapshotBuffer: GameSnapshot[];

  setAppView: (view: AppView) => void;
  setPlayerName: (name: string) => void;
  setPlayerColor: (color: BattleColor) => void;
  setRoomCode: (code: string) => void;
  updateFromSnapshot: (snapshot: GameSnapshot) => void;
  handleHit: () => void;
  handleMatchEnd: (stats: MatchStats) => void;
  reset: () => void;
  setError: (error: string | null) => void;
  setRoomStatus: (status: RoomStatus) => void;
  setPlayerId: (id: string) => void;
  setOpponentInfo: (name: string, color: BattleColor | null) => void;
  setIsHost: (isHost: boolean) => void;
  setCountdown: (countdown: number | null) => void;
  setConnectionQuality: (quality: 'good' | 'fair' | 'poor' | 'disconnected') => void;

  // Solo Practice Mode Actions
  startSoloGame: () => void;
  updateSoloSelf: (
    pos: [number, number, number],
    rot: [number, number, number],
    vel: [number, number, number],
    hp: number,
    isBoosting: boolean,
    throttle: number
  ) => void;
  updateSoloOpponent: (
    pos: [number, number, number],
    rot: [number, number, number],
    vel: [number, number, number],
    hp: number,
    isBoosting: boolean,
    throttle: number
  ) => void;
  addSoloProjectile: (proj: ProjectileState) => void;
  setProjectiles: (projs: ProjectileState[]) => void;
  applyDamageToSoloPlayer: (damage: number) => void;
  applyDamageToSoloOpponent: (damage: number) => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  appView: 'LANDING',
  playerName: '',
  playerColor: 'yellow',
  roomCode: '',
  roomStatus: 'WAITING',
  playerId: '',
  isHost: false,
  isSolo: false,
  opponentName: '',
  opponentColor: null,
  selfState: null,
  opponentState: null,
  projectiles: [],
  matchResult: null,
  connectionQuality: 'disconnected',
  countdown: null,
  error: null,
  snapshotBuffer: [],

  setAppView: (view) => set({ appView: view }),
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerColor: (color) => set({ playerColor: color }),
  setRoomCode: (code) => set({ roomCode: code }),
  updateFromSnapshot: (snapshot) => {
    const { playerId } = get();
    const selfState = snapshot.players.find(p => p.id === playerId) || null;
    const opponentState = snapshot.players.find(p => p.id !== playerId) || null;

    set(state => {
      const newBuffer = [...state.snapshotBuffer, snapshot].slice(-2);
      return {
        snapshotBuffer: newBuffer,
        selfState,
        opponentState,
        projectiles: snapshot.projectiles,
        roomStatus: snapshot.roomStatus
      };
    });
  },
  handleHit: () => {
    // Visual or audio hit feedback
  },
  handleMatchEnd: (stats) => set({ matchResult: stats, appView: 'RESULT', roomStatus: 'FINISHED' }),
  reset: () => set({
    appView: 'LANDING',
    isSolo: false,
    roomCode: '',
    roomStatus: 'WAITING',
    opponentName: '',
    opponentColor: null,
    selfState: null,
    opponentState: null,
    projectiles: [],
    matchResult: null,
    countdown: null,
    error: null,
    snapshotBuffer: []
  }),
  setError: (error) => set({ error }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  setPlayerId: (id) => set({ playerId: id }),
  setOpponentInfo: (name, color) => set({ opponentName: name, opponentColor: color }),
  setIsHost: (isHost) => set({ isHost }),
  setCountdown: (countdown) => set({ countdown }),
  setConnectionQuality: (quality) => set({ connectionQuality: quality }),

  // Solo Practice Mode
  startSoloGame: () => {
    const { playerName, playerColor } = get();
    const name = playerName.trim() || 'Cadet Vanguard';
    const opponentCol: BattleColor = playerColor === 'red' ? 'blue' : 'red';

    const initialSelf: PlayerState = {
      id: 'solo_player',
      name,
      color: playerColor,
      position: [0, 5, -80],
      rotation: [0, 0, 0],
      velocity: [0, 0, 0],
      hp: 100,
      maxHp: 100,
      alive: true,
      throttle: 0,
      isBoosting: false
    };

    const initialOpponent: PlayerState = {
      id: 'solo_ai_drone',
      name: 'TARGET DRONE (AI)',
      color: opponentCol,
      position: [0, 8, 80],
      rotation: [0, Math.PI, 0],
      velocity: [0, 0, 15],
      hp: 100,
      maxHp: 100,
      alive: true,
      throttle: 0.5,
      isBoosting: false
    };

    set({
      isSolo: true,
      playerId: 'solo_player',
      playerName: name,
      playerColor,
      selfState: initialSelf,
      opponentState: initialOpponent,
      opponentName: 'TARGET DRONE (AI)',
      opponentColor: opponentCol,
      roomCode: 'SOLO',
      roomStatus: 'BATTLE',
      appView: 'BATTLE',
      connectionQuality: 'good',
      projectiles: [],
      matchResult: null,
      countdown: null,
      error: null
    });
  },

  updateSoloSelf: (pos, rot, vel, hp, isBoosting, throttle) => {
    set(state => {
      if (!state.selfState) return {};
      return {
        selfState: {
          ...state.selfState,
          position: pos,
          rotation: rot,
          velocity: vel,
          hp,
          alive: hp > 0,
          isBoosting,
          throttle
        }
      };
    });
  },

  updateSoloOpponent: (pos, rot, vel, hp, isBoosting, throttle) => {
    set(state => {
      if (!state.opponentState) return {};
      return {
        opponentState: {
          ...state.opponentState,
          position: pos,
          rotation: rot,
          velocity: vel,
          hp,
          alive: hp > 0,
          isBoosting,
          throttle
        }
      };
    });
  },

  addSoloProjectile: (proj) => {
    set(state => ({
      projectiles: [...state.projectiles, proj].slice(-30)
    }));
  },

  setProjectiles: (projs) => set({ projectiles: projs }),

  applyDamageToSoloPlayer: (damage) => {
    set(state => {
      if (!state.selfState) return {};
      const newHp = Math.max(0, state.selfState.hp - damage);
      return {
        selfState: {
          ...state.selfState,
          hp: newHp,
          alive: newHp > 0
        }
      };
    });
  },

  applyDamageToSoloOpponent: (damage) => {
    set(state => {
      if (!state.opponentState) return {};
      const newHp = Math.max(0, state.opponentState.hp - damage);
      return {
        opponentState: {
          ...state.opponentState,
          hp: newHp,
          alive: newHp > 0
        }
      };
    });
  }
}));
