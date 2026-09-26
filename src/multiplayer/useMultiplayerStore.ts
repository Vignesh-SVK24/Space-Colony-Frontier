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
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  appView: 'LANDING',
  playerName: '',
  playerColor: 'yellow',
  roomCode: '',
  roomStatus: 'WAITING',
  playerId: '',
  isHost: false,
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
    // Future visual feedback hook
  },
  handleMatchEnd: (stats) => set({ matchResult: stats, appView: 'RESULT', roomStatus: 'FINISHED' }),
  reset: () => set({
    appView: 'LANDING',
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
  setConnectionQuality: (quality) => set({ connectionQuality: quality })
}));
