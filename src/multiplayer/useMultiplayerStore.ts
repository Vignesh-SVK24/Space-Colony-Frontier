import { create } from 'zustand';
import {
  AppView,
  BattleColor,
  GameMode,
  RoomStatus,
  Team,
  PlayerState,
  ProjectileState,
  MatchStats,
  LaserEvent,
  LeadIndicatorInfo,
  DamageEvent,
  CombatTelemetryEntry,
  RoomPlayerInfo,
  GameSnapshot
} from './types';
import { CombatDifficulty, COMBAT_CONFIG } from '../config/combatConfig';

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
  gameMode: GameMode;
  aiDifficulty: CombatDifficulty;
  playerName: string;
  playerColor: BattleColor;
  playerTeam: Team;
  roomCode: string;
  roomStatus: RoomStatus;
  playerId: string;
  isHost: boolean;
  isSolo: boolean;
  opponentName: string;
  opponentColor: BattleColor | null;
  selfState: PlayerState | null;
  opponentState: PlayerState | null;
  otherPlayers: PlayerState[];
  roomPlayers: RoomPlayerInfo[];
  serverUrl: string;
  projectiles: ProjectileState[];
  matchResult: MatchStats | null;
  connectionQuality: 'good' | 'fair' | 'poor' | 'disconnected' | 'connecting';
  countdown: number | null;
  error: string | null;
  isServerOnline: boolean | null;
  checkServerReachability: () => Promise<boolean>;

  // Tactical Map
  isMapOpen: boolean;

  // Weapon Cooldowns, Ammo & Visual FX
  ammo: number;
  isReloading: boolean;
  reloadTimeRemaining: number;
  laserCooldownRemaining: number;
  solarCooldownRemaining: number;
  bulletCooldownRemaining: number;
  activeLaserBeam: LaserEvent | null;
  activeSolarBeam: LaserEvent | null;
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

  // Action methods
  setJoystickAxis: (axis: { x: number; y: number }) => void;
  setAppView: (view: AppView) => void;
  setGameModeSelection: (mode: 'SELECT' | 'SOLO_CONFIG' | 'ROOM_CONFIG') => void;
  setGameMode: (mode: GameMode) => void;
  setAIDifficulty: (diff: CombatDifficulty) => void;
  setPlayerName: (name: string) => void;
  setPlayerColor: (color: BattleColor) => void;
  setPlayerTeam: (team: Team) => void;
  setRoomCode: (code: string) => void;
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
  setConnectionQuality: (quality: 'good' | 'fair' | 'poor' | 'disconnected' | 'connecting') => void;

  // Weapon Actions
  setAmmo: (ammo: number) => void;
  setIsReloading: (reloading: boolean) => void;
  setReloadTimeRemaining: (sec: number) => void;
  setLaserCooldownRemaining: (sec: number) => void;
  setSolarCooldownRemaining: (sec: number) => void;
  setBulletCooldownRemaining: (sec: number) => void;
  setActiveLaserBeam: (beam: LaserEvent | null) => void;
  setActiveSolarBeam: (beam: LaserEvent | null) => void;
  setTargetLock: (lock: TargetLockInfo | null) => void;
  setLeadIndicator: (lead: LeadIndicatorInfo | null) => void;
  toggleMap: () => void;
  setMapOpen: (open: boolean) => void;

  setSelfState: (self: PlayerState | null) => void;
  setOpponentState: (opp: PlayerState | null) => void;
  setOtherPlayers: (players: PlayerState[]) => void;
  addProjectile: (proj: ProjectileState) => void;
  setProjectiles: (projs: ProjectileState[]) => void;
  updateFromSnapshot: (snapshot: GameSnapshot) => void;

  // Solo Practice Mode Actions (Strict 250 HP and identical rules)
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
    const envServer = import.meta.env.VITE_SERVER_URL;
    if (envServer) return envServer;
  } catch {}
  const host = (typeof window !== 'undefined' && window.location.hostname) || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (isLocal) {
    return 'http://localhost:3001';
  }
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return isHttps ? `https://${host}:3001` : `http://${host}:3001`;
};

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  appView: 'LANDING',
  gameModeSelection: 'SELECT',
  gameMode: '1v1',
  aiDifficulty: 'NORMAL',
  playerName: '',
  playerColor: 'yellow',
  playerTeam: 'NONE',
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
  isServerOnline: null,

  checkServerReachability: async () => {
    const server = get().serverUrl;
    if (!server) {
      set({ isServerOnline: false });
      return false;
    }
    let httpUrl = server.trim().replace(/^ws:\/\//, 'http://').replace(/^wss:\/\//, 'https://');
    if (!httpUrl.startsWith('http://') && !httpUrl.startsWith('https://')) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      httpUrl = `${isHttps ? 'https' : 'http'}://${httpUrl}`;
    }
    httpUrl = `${httpUrl.replace(/\/+$/, '')}/health`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(httpUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      const isOk = res.ok;
      set({ isServerOnline: isOk });
      return isOk;
    } catch {
      set({ isServerOnline: false });
      return false;
    }
  },

  isMapOpen: false,

  ammo: COMBAT_CONFIG.BULLET_MAGAZINE_SIZE,
  isReloading: false,
  reloadTimeRemaining: 0,
  laserCooldownRemaining: 0,
  solarCooldownRemaining: 0,
  bulletCooldownRemaining: 0,
  activeLaserBeam: null,
  activeSolarBeam: null,
  targetLock: null,
  leadIndicator: null,
  hitConfirmActive: false,
  joystickAxis: { x: 0, y: 0 },

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

  updateFromSnapshot: (snapshot) => {
    const { playerId, lastAppliedServerTick } = get();
    const tick = snapshot.serverTick ?? 0;

    const selfSnap = snapshot.players.find((p: any) => p.id === playerId);
    const oppSnap = snapshot.players.find((p: any) => p.id !== playerId);

    set(state => {
      let updatedSelf = state.selfState;
      if (selfSnap) {
        const hp = (tick > 0 && tick < lastAppliedServerTick && state.selfState) ? state.selfState.hp : selfSnap.hp;
        updatedSelf = {
          ...state.selfState,
          ...selfSnap,
          hp
        };
      }

      let updatedOpp = state.opponentState;
      if (oppSnap) {
        const hp = (tick > 0 && tick < lastAppliedServerTick && state.opponentState) ? state.opponentState.hp : oppSnap.hp;
        updatedOpp = {
          ...state.opponentState,
          ...oppSnap,
          hp
        };
      }

      return {
        selfState: updatedSelf,
        opponentState: updatedOpp,
        projectiles: snapshot.projectiles || state.projectiles,
        roomStatus: snapshot.roomStatus || state.roomStatus
      };
    });
  },

  setJoystickAxis: (axis) => set({ joystickAxis: axis }),
  setAppView: (view) => set({ appView: view }),
  setGameModeSelection: (mode) => set({ gameModeSelection: mode }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setAIDifficulty: (diff) => set({ aiDifficulty: diff }),
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerColor: (color) => set({ playerColor: color }),
  setPlayerTeam: (team) => set({ playerTeam: team }),
  setRoomCode: (code) => set({ roomCode: code }),
  
  handleHit: () => {},
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
    solarCooldownRemaining: 0,
    bulletCooldownRemaining: 0,
    ammo: COMBAT_CONFIG.BULLET_MAGAZINE_SIZE,
    isReloading: false,
    reloadTimeRemaining: 0,
    projectiles: []
  }),

  reset: () => set({
    appView: 'LANDING',
    gameModeSelection: 'SELECT',
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
    projectiles: [],
    matchResult: null,
    connectionQuality: 'disconnected',
    countdown: null,
    error: null,
    isMapOpen: false,
    ammo: COMBAT_CONFIG.BULLET_MAGAZINE_SIZE,
    isReloading: false,
    reloadTimeRemaining: 0,
    laserCooldownRemaining: 0,
    solarCooldownRemaining: 0,
    bulletCooldownRemaining: 0,
    activeLaserBeam: null,
    activeSolarBeam: null,
    targetLock: null,
    leadIndicator: null,
    hitConfirmActive: false,
    combatTelemetryLog: [],
    lastAppliedServerTick: 0
  }),

  setError: (error) => set({ error }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  setPlayerId: (id) => set({ playerId: id }),
  setOpponentInfo: (name, color) => set({ opponentName: name, opponentColor: color }),
  setRoomPlayers: (players) => set({ roomPlayers: players }),
  setServerUrl: (url) => {
    set({ serverUrl: url, isServerOnline: null });
    get().checkServerReachability();
  },
  setIsHost: (isHost) => set({ isHost }),
  setCountdown: (countdown) => set({ countdown }),
  setConnectionQuality: (quality) => set({ connectionQuality: quality }),

  setAmmo: (ammo) => set({ ammo }),
  setIsReloading: (isReloading) => set({ isReloading }),
  setReloadTimeRemaining: (reloadTimeRemaining) => set({ reloadTimeRemaining }),
  setLaserCooldownRemaining: (laserCooldownRemaining) => set({ laserCooldownRemaining }),
  setSolarCooldownRemaining: (solarCooldownRemaining) => set({ solarCooldownRemaining }),
  setBulletCooldownRemaining: (bulletCooldownRemaining) => set({ bulletCooldownRemaining }),
  setActiveLaserBeam: (activeLaserBeam) => set({ activeLaserBeam }),
  setActiveSolarBeam: (activeSolarBeam) => set({ activeSolarBeam }),
  setTargetLock: (targetLock) => set({ targetLock }),
  setLeadIndicator: (leadIndicator) => set({ leadIndicator }),
  toggleMap: () => set(state => ({ isMapOpen: !state.isMapOpen })),
  setMapOpen: (open) => set({ isMapOpen: open }),

  setSelfState: (selfState) => set({ selfState }),
  setOpponentState: (opponentState) => set({ opponentState }),
  setOtherPlayers: (otherPlayers) => set({ otherPlayers }),
  addProjectile: (proj) => set(state => ({ projectiles: [...state.projectiles, proj].slice(-50) })),
  setProjectiles: (projectiles) => set({ projectiles }),

  // Solo Mode Aligned with 250 HP and Exact Match Rules
  startSoloGame: () => {
    const { playerName, playerColor, aiDifficulty } = get();
    const name = playerName.trim() || 'Cadet-01';
    const opponentCol: BattleColor = playerColor === 'yellow' ? 'blue' : 'yellow';
    const diffLabel = aiDifficulty;

    const initialSelf: PlayerState = {
      id: 'solo_player',
      name,
      color: playerColor,
      team: 'NONE',
      slot: 1,
      position: [0, 0, -80],
      rotation: [0, 0, 0],
      velocity: [0, 0, 0],
      hp: COMBAT_CONFIG.MAX_HP, // 250
      maxHp: COMBAT_CONFIG.MAX_HP, // 250
      alive: true,
      ready: true,
      isHost: true,
      throttle: 0,
      isBoosting: false,
      ammo: COMBAT_CONFIG.BULLET_MAGAZINE_SIZE,
      isReloading: false,
      reloadTimeRemaining: 0,
      laserCooldownRemaining: 0,
      solarCooldownRemaining: 0
    };

    const initialOpponent: PlayerState = {
      id: 'solo_ai_drone',
      name: `TARGET DRONE (${diffLabel})`,
      color: opponentCol,
      team: 'NONE',
      slot: 2,
      position: [0, 15, 80],
      rotation: [0, Math.PI, 0],
      velocity: [0, 0, 15],
      hp: COMBAT_CONFIG.MAX_HP, // 250
      maxHp: COMBAT_CONFIG.MAX_HP, // 250
      alive: true,
      ready: true,
      isHost: false,
      throttle: 0.5,
      isBoosting: false,
      ammo: COMBAT_CONFIG.BULLET_MAGAZINE_SIZE,
      isReloading: false,
      reloadTimeRemaining: 0,
      laserCooldownRemaining: 0,
      solarCooldownRemaining: 0
    };

    set({
      isSolo: true,
      playerId: 'solo_player',
      playerName: name,
      playerColor,
      playerTeam: 'NONE',
      gameMode: '1v1',
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
      ammo: COMBAT_CONFIG.BULLET_MAGAZINE_SIZE,
      isReloading: false,
      reloadTimeRemaining: 0,
      laserCooldownRemaining: 0,
      solarCooldownRemaining: 0,
      bulletCooldownRemaining: 0,
      activeLaserBeam: null,
      activeSolarBeam: null,
      targetLock: null,
      leadIndicator: null,
      hitConfirmActive: false
    });
  },

  updateSoloSelf: (pos, rot, vel, explicitHp, isBoosting, throttle) => {
    set(state => {
      if (!state.selfState) return {};
      const hp = (typeof explicitHp === 'number' && explicitHp < state.selfState.hp) ? explicitHp : state.selfState.hp;
      return {
        selfState: {
          ...state.selfState,
          position: pos,
          rotation: rot,
          velocity: vel,
          hp,
          alive: hp > 0,
          isBoosting: isBoosting ?? false,
          throttle: throttle ?? 0
        }
      };
    });
  },

  updateSoloOpponent: (pos, rot, vel, explicitHp, isBoosting, throttle) => {
    set(state => {
      if (!state.opponentState) return {};
      const hp = (typeof explicitHp === 'number' && explicitHp < state.opponentState.hp) ? explicitHp : state.opponentState.hp;
      const updatedOpponent: PlayerState = {
        ...state.opponentState,
        position: pos,
        rotation: rot,
        velocity: vel,
        hp,
        alive: hp > 0,
        isBoosting: isBoosting ?? false,
        throttle: throttle ?? 0
      };
      return {
        opponentState: updatedOpponent,
        otherPlayers: [updatedOpponent]
      };
    });
  },

  addSoloProjectile: (proj) => {
    set(state => ({
      projectiles: [...state.projectiles, proj].slice(-50)
    }));
  },

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
    get().handleHit();
  },

  applyDamageToSoloOpponent: (damage) => {
    set(state => {
      if (!state.opponentState) return {};
      const newHp = Math.max(0, state.opponentState.hp - damage);
      const updatedOpp: PlayerState = {
        ...state.opponentState,
        hp: newHp,
        alive: newHp > 0
      };
      return {
        opponentState: updatedOpp,
        otherPlayers: [updatedOpp]
      };
    });
    get().triggerHitConfirm();
  }
}));
