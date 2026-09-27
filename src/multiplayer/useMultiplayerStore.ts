import { create } from 'zustand';
import { AppView, BattleColor, RoomStatus, GameSnapshot, PlayerState, ProjectileState, MatchStats, LaserEvent, LeadIndicatorInfo, DamageEvent, CombatTelemetryEntry, RoomPlayerInfo } from './types';
import { CombatDifficulty } from '../config/combatConfig';

export type { LaserEvent, LeadIndicatorInfo, DamageEvent, CombatTelemetryEntry, RoomPlayerInfo };

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
  otherPlayers: PlayerState[]; // All remote players in 4-player match
  roomPlayers: RoomPlayerInfo[]; // All pilots in room lobby
  serverUrl: string;
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

  // Combat Debug & Telemetry
  showCombatHitboxes: boolean;
  showCombatTrajectories: boolean;
  showCombatAimVector: boolean;
  combatTelemetryLog: CombatTelemetryEntry[];
  lastAppliedServerTick: number;

  toggleCombatHitboxes: () => void;
  toggleCombatTrajectories: () => void;
  toggleCombatAimVector: () => void;
  handleDamageApplied: (event: DamageEvent) => void;

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
  setRoomPlayers: (players: RoomPlayerInfo[]) => void;
  setServerUrl: (url: string) => void;
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

const getDefaultServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  try {
    const params = new URLSearchParams(window.location.search);
    const queryServer = params.get('server');
    if (queryServer) return queryServer;
    const stored = localStorage.getItem('sfc_server_url');
    if (stored) return stored;
  } catch {}
  return `http://${(typeof window !== 'undefined' && window.location.hostname) || 'localhost'}:3001`;
};

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
  otherPlayers: [],
  roomPlayers: [],
  serverUrl: getDefaultServerUrl(),
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

  // Combat Debug & Telemetry initial state
  showCombatHitboxes: false,
  showCombatTrajectories: false,
  showCombatAimVector: false,
  combatTelemetryLog: [],
  lastAppliedServerTick: 0,

  toggleCombatHitboxes: () => set(state => ({ showCombatHitboxes: !state.showCombatHitboxes })),
  toggleCombatTrajectories: () => set(state => ({ showCombatTrajectories: !state.showCombatTrajectories })),
  toggleCombatAimVector: () => set(state => ({ showCombatAimVector: !state.showCombatAimVector })),

  handleDamageApplied: (event) => {
    const tick = event.serverTick ?? 0;
    const myId = get().playerId;
    const isTargetMe = event.targetId === myId;
    const isAttackerMe = event.attackerId === myId;

    const telemetryEntry: CombatTelemetryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      attackId: event.attackId || 'unknown',
      timestamp: event.timestamp || Date.now(),
      serverTick: tick,
      weapon: event.weapon || event.weaponType || 'weapon',
      attackerId: event.attackerId,
      targetId: event.targetId,
      damage: event.damage,
      remainingHp: event.newHp
    };

    set(state => {
      const updatedSelf = state.selfState && isTargetMe
        ? { ...state.selfState, hp: event.newHp, alive: event.newHp > 0 }
        : state.selfState;

      const updatedOtherPlayers = state.otherPlayers.map(p => {
        if (p.id === event.targetId) {
          return { ...p, hp: event.newHp, alive: event.newHp > 0 };
        }
        return p;
      });

      const updatedOpponent = state.opponentState && !isTargetMe
        ? { ...state.opponentState, hp: event.newHp, alive: event.newHp > 0 }
        : (updatedOtherPlayers.length > 0 ? updatedOtherPlayers[0] : state.opponentState);

      const newLog = [telemetryEntry, ...state.combatTelemetryLog].slice(0, 15);

      return {
        selfState: updatedSelf,
        otherPlayers: updatedOtherPlayers,
        opponentState: updatedOpponent,
        combatTelemetryLog: newLog,
        lastAppliedServerTick: Math.max(state.lastAppliedServerTick, tick)
      };
    });

    if (isTargetMe) {
      get().handleHit();
    }
    if (isAttackerMe) {
      get().triggerHitConfirm();
    }
  },

  setJoystickAxis: (axis) => set({ joystickAxis: axis }),
  setAppView: (view) => set({ appView: view }),
  setGameModeSelection: (mode) => set({ gameModeSelection: mode }),
  setAIDifficulty: (diff) => set({ aiDifficulty: diff }),
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerColor: (color) => set({ playerColor: color }),
  setRoomCode: (code) => set({ roomCode: code }),
  
  updateFromSnapshot: (snapshot) => {
    const { playerId, lastAppliedServerTick, selfState: prevSelf } = get();
    const currentTick = snapshot.serverTick ?? 0;
    
    const rawSelf = snapshot.players.find(p => p.id === playerId) || null;
    const selfState = rawSelf ? {
      ...rawSelf,
      hp: currentTick < lastAppliedServerTick && prevSelf ? prevSelf.hp : rawSelf.hp,
      alive: (currentTick < lastAppliedServerTick && prevSelf ? prevSelf.hp : rawSelf.hp) > 0
    } : null;

    // Up to 3 remote opponents in 4-player match
    const otherPlayers = snapshot.players
      .filter(p => p.id !== playerId)
      .map(p => {
        const prevP = get().otherPlayers.find(op => op.id === p.id);
        const hp = currentTick < lastAppliedServerTick && prevP ? prevP.hp : p.hp;
        return {
          ...p,
          hp,
          alive: hp > 0
        };
      });

    const opponentState = otherPlayers.length > 0 ? otherPlayers[0] : null;

    set(state => {
      const newBuffer = [...state.snapshotBuffer, snapshot].slice(-2);
      return {
        snapshotBuffer: newBuffer,
        selfState,
        otherPlayers,
        opponentState,
        projectiles: snapshot.projectiles,
        roomStatus: snapshot.roomStatus,
        lastAppliedServerTick: Math.max(state.lastAppliedServerTick, currentTick)
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
    projectiles: [],
    lastAppliedServerTick: 0,
    combatTelemetryLog: []
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
    otherPlayers: [],
    roomPlayers: [],
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
    snapshotBuffer: [],
    lastAppliedServerTick: 0,
    combatTelemetryLog: []
  }),

  setError: (error) => set({ error }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  setPlayerId: (id) => set({ playerId: id }),
  setOpponentInfo: (name, color) => set({ opponentName: name, opponentColor: color }),
  setRoomPlayers: (players) => set({ roomPlayers: players }),
  setServerUrl: (url) => {
    try {
      localStorage.setItem('sfc_server_url', url);
    } catch {}
    set({ serverUrl: url });
  },
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
      otherPlayers: [initialOpponent],
      roomPlayers: [
        { id: 'solo_player', name, color: playerColor, isHost: true, slot: 1, ready: true },
        { id: 'solo_ai_drone', name: `TARGET DRONE (${diffLabel})`, color: opponentCol, isHost: false, slot: 2, ready: true }
      ],
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
      const updatedOpponent = {
        ...state.opponentState,
        position: pos,
        rotation: rot,
        velocity: vel,
        hp,
        alive: hp > 0,
        isBoosting,
        throttle
      };
      return {
        opponentState: updatedOpponent,
        otherPlayers: [updatedOpponent]
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
      const updatedOpp = {
        ...state.opponentState,
        hp: newHp,
        alive: newHp > 0
      };
      return {
        opponentState: updatedOpp,
        otherPlayers: [updatedOpp]
      };
    });
  }
}));
