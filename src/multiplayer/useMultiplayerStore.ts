import { create } from 'zustand';
import { AppView, BattleColor, RoomStatus, GameSnapshot, PlayerState, ProjectileState, MatchStats, LaserEvent, LeadIndicatorInfo } from './types';
import { CombatDifficulty } from '../config/combatConfig';

export type { LaserEvent, LeadIndicatorInfo };

export interface TargetLockInfo {
  id: string;
  name: string;
  distance: number;
  hp: number;
}

interface MultiplayerState {
  appView: AppView;
  gameModeSelection: 'SELECT' | 'SOLO_CONFIG' | 'ROOM_CONFIG';
  aiDifficulty: CombatDifficulty;
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

  // Tactical Map
  isMapOpen: boolean;

  // Weapon Cooldowns & Beam FX
  laserCooldownRemaining: number;
  bulletCooldownRemaining: number;
  activeLaserBeam: LaserEvent | null;
  targetLock: TargetLockInfo | null;
  leadIndicator: LeadIndicatorInfo | null;
  hitConfirmActive: boolean;
  joystickAxis: { x: number; y: number };

  snapshotBuffer: GameSnapshot[];

  // Action methods
  setJoystickAxis: (axis: { x: number; y: number }) => void;
  setAppView: (view: AppView) => void;
  setGameModeSelection: (mode: 'SELECT' | 'SOLO_CONFIG' | 'ROOM_CONFIG') => void;
  setAIDifficulty: (diff: CombatDifficulty) => void;
  setPlayerName: (name: string) => void;
  setPlayerColor: (color: BattleColor) => void;
  setRoomCode: (code: string) => void;
  updateFromSnapshot: (snapshot: GameSnapshot) => void;
  handleHit: () => void;
  triggerHitConfirm: () => void;
  handleMatchEnd: (stats: MatchStats) => void;
  handleRematchReset: () => void;
  reset: () => void;
  setError: (error: string | null) => void;
  setRoomStatus: (status: RoomStatus) => void;
  setPlayerId: (id: string) => void;
  setOpponentInfo: (name: string, color: BattleColor | null) => void;
  setIsHost: (isHost: boolean) => void;
  setCountdown: (countdown: number | null) => void;
  setConnectionQuality: (quality: 'good' | 'fair' | 'poor' | 'disconnected') => void;

  // Map & Combat Actions
  toggleMap: () => void;
  setMapOpen: (open: boolean) => void;
  setLaserCooldownRemaining: (sec: number) => void;
  setBulletCooldownRemaining: (sec: number) => void;
  setActiveLaserBeam: (beam: LaserEvent | null) => void;
  setTargetLock: (lock: TargetLockInfo | null) => void;
  setLeadIndicator: (lead: LeadIndicatorInfo | null) => void;

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

let hitConfirmTimer: any = null;

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  appView: 'LANDING',
  gameModeSelection: 'SELECT',
  aiDifficulty: 'NORMAL',
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
  isMapOpen: false,
  laserCooldownRemaining: 0,
  bulletCooldownRemaining: 0,
  activeLaserBeam: null,
  targetLock: null,
  leadIndicator: null,
  hitConfirmActive: false,
  joystickAxis: { x: 0, y: 0 },
  snapshotBuffer: [],

  setJoystickAxis: (axis) => set({ joystickAxis: axis }),
  setAppView: (view) => set({ appView: view }),
  setGameModeSelection: (mode) => set({ gameModeSelection: mode }),
  setAIDifficulty: (diff) => set({ aiDifficulty: diff }),
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
    // Screen flash / damage feedback
  },

  triggerHitConfirm: () => {
    if (hitConfirmTimer) clearTimeout(hitConfirmTimer);
    set({ hitConfirmActive: true });
    hitConfirmTimer = setTimeout(() => {
      set({ hitConfirmActive: false });
    }, 280);
  },

  handleMatchEnd: (stats) => set({ matchResult: stats, appView: 'RESULT', roomStatus: 'FINISHED' }),
  
  handleRematchReset: () => set({
    matchResult: null,
    appView: 'BATTLE',
    roomStatus: 'COUNTDOWN',
    countdown: 3,
    laserCooldownRemaining: 0,
    bulletCooldownRemaining: 0,
    activeLaserBeam: null,
    targetLock: null,
    hitConfirmActive: false,
    projectiles: []
  }),

  reset: () => set({
    appView: 'LANDING',
    gameModeSelection: 'SELECT',
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
    isMapOpen: false,
    laserCooldownRemaining: 0,
    bulletCooldownRemaining: 0,
    activeLaserBeam: null,
    targetLock: null,
    leadIndicator: null,
    hitConfirmActive: false,
    joystickAxis: { x: 0, y: 0 },
    snapshotBuffer: []
  }),

  setError: (error) => set({ error }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  setPlayerId: (id) => set({ playerId: id }),
  setOpponentInfo: (name, color) => set({ opponentName: name, opponentColor: color }),
  setIsHost: (isHost) => set({ isHost }),
  setCountdown: (countdown) => set({ countdown }),
  setConnectionQuality: (quality) => set({ connectionQuality: quality }),

  // Map & Combat
  toggleMap: () => set(state => ({ isMapOpen: !state.isMapOpen })),
  setMapOpen: (open) => set({ isMapOpen: open }),
  setLaserCooldownRemaining: (sec) => set({ laserCooldownRemaining: Math.max(0, sec) }),
  setBulletCooldownRemaining: (sec) => set({ bulletCooldownRemaining: Math.max(0, sec) }),
  setActiveLaserBeam: (beam) => set({ activeLaserBeam: beam }),
  setTargetLock: (lock) => set({ targetLock: lock }),
  setLeadIndicator: (lead) => set({ leadIndicator: lead }),

  // Solo Practice Mode
  startSoloGame: () => {
    const { playerName, playerColor, aiDifficulty } = get();
    const name = playerName.trim() || 'Cadet Vanguard';
    const opponentCol: BattleColor = playerColor === 'red' ? 'blue' : 'red';
    const diffLabel = aiDifficulty === 'EASY' ? 'DRONE (EASY)' : aiDifficulty === 'HARD' ? 'CORVETTE (HARD)' : 'DRONE (NORMAL)';

    const initialSelf: PlayerState = {
      id: 'solo_player',
      name,
      color: playerColor,
      position: [0, 15, -120],
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
      name: `TARGET DRONE (${diffLabel})`,
      color: opponentCol,
      position: [0, 15, 120],
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
      opponentName: `TARGET DRONE (${diffLabel})`,
      opponentColor: opponentCol,
      roomCode: 'SOLO',
      roomStatus: 'BATTLE',
      appView: 'BATTLE',
      connectionQuality: 'good',
      projectiles: [],
      matchResult: null,
      countdown: null,
      error: null,
      isMapOpen: false,
      laserCooldownRemaining: 0,
      bulletCooldownRemaining: 0,
      activeLaserBeam: null,
      targetLock: null,
      leadIndicator: null,
      hitConfirmActive: false
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
      projectiles: [...state.projectiles, proj].slice(-40)
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
