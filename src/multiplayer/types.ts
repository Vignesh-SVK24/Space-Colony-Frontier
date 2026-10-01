import { BattleColor, GameMode, RoomStatus, Team, WeaponType } from '../shared/gameConfig';

export type { BattleColor, GameMode, RoomStatus, Team, WeaponType };
export type AppView = 'LANDING' | 'LOBBY' | 'BATTLE' | 'RESULT';

export interface PlayerInput {
  thrust: number;     // -1 to 1
  yaw: number;        // -1 to 1
  pitch: number;      // -1 to 1
  roll: number;       // -1 to 1
  vertical: number;   // -1 to 1
  boost: boolean;
  brake: boolean;
}

export interface PlayerState {
  id: string;
  sessionId?: string;
  name: string;
  color: BattleColor;
  team: Team;
  slot: number;
  position: [number, number, number];
  rotation: [number, number, number]; // euler YXZ
  velocity: [number, number, number];
  hp: number;
  maxHp: number;
  alive: boolean;
  ready?: boolean;
  isHost?: boolean;
  throttle: number;
  isBoosting: boolean;
  ammo: number;
  isReloading: boolean;
  reloadTimeRemaining: number;
  laserCooldownRemaining: number;
  solarCooldownRemaining: number;
}

export interface ProjectileState {
  id: string;
  attackId: string;
  ownerId: string;
  weaponType: WeaponType;
  position: [number, number, number];
  direction: [number, number, number];
  color: BattleColor;
  team: Team;
  speed: number;
  damage: number;
  createdAt: number;
}

export interface LaserEvent {
  attackId: string;
  shooterId: string;
  start: [number, number, number];
  end: [number, number, number];
  blocked: boolean;
  hitTargetId?: string;
  color: BattleColor;
  damage?: number;
  weaponType?: 'LASER' | 'SOLAR_BEAM';
  timestamp: number;
}

export interface DamageEvent {
  attackId: string;
  targetId: string;
  attackerId: string;
  defenderId?: string;
  damage: number;
  newHp: number;
  remainingHp?: number;
  weapon: 'bullet' | 'laser' | 'solar' | 'collision';
  weaponType?: WeaponType;
  serverTick?: number;
  timestamp: number;
}

export interface GameSnapshot {
  players: any[];
  projectiles: any[];
  timestamp: number;
  serverTick?: number;
  roomStatus?: RoomStatus;
}

export interface CombatTelemetryEntry {
  id: string;
  attackId: string;
  timestamp: number;
  serverTick: number;
  weapon: string;
  attackerId: string;
  targetId: string;
  damage: number;
  remainingHp: number;
}

export interface LeadIndicatorInfo {
  worldPos: [number, number, number];
  distance: number;
  visible: boolean;
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  color: BattleColor;
  team?: Team;
  ready?: boolean;
  isHost?: boolean;
  slot?: number;
}

export interface RoomInfo {
  code: string;
  mode: GameMode;
  players: RoomPlayerInfo[];
  status: RoomStatus;
}

export interface MatchStats {
  winner: string;
  winnerName: string;
  winnerTeam?: Team;
  loserName: string;
  mode: GameMode;
  damageDealt: number;
  shotsHit: number;
  shotsFired: number;
  accuracy: number;
  matchDuration: number;
}
