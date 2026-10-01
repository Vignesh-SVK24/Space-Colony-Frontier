import { BattleColor, GameMode, Team, WeaponType } from './gameConfig.js';

export interface PlayerInput {
  thrust: number;     // -1 to 1
  yaw: number;        // -1 to 1
  pitch: number;      // -1 to 1
  roll: number;       // -1 to 1
  vertical: number;   // -1 to 1
  boost: boolean;
  brake: boolean;
}

export interface PlayerNetworkState {
  id: string;
  sessionId: string;
  name: string;
  color: BattleColor;
  team: Team;
  slot: number;
  position: [number, number, number];
  rotation: [number, number, number]; // pitch, yaw, roll
  velocity: [number, number, number];
  hp: number;
  maxHp: number;
  alive: boolean;
  ready: boolean;
  isHost: boolean;
  ammo: number;
  isReloading: boolean;
  reloadTimeRemaining: number;
  laserCooldownRemaining: number;
  solarCooldownRemaining: number;
  ping: number;
  score: number;
}

export interface ProjectileNetworkState {
  id: string;
  attackId: string;
  ownerId: string;
  weaponType: WeaponType;
  position: [number, number, number];
  prevPosition: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  color: BattleColor;
  team: Team;
  spawnTime: number;
}

export interface LaserBeamNetworkEvent {
  attackId: string;
  shooterId: string;
  start: [number, number, number];
  end: [number, number, number];
  blocked: boolean;
  hitTargetId?: string;
  color: BattleColor;
  weaponType: 'LASER' | 'SOLAR_BEAM';
  timestamp: number;
}

export interface DamageNetworkEvent {
  attackId: string;
  attackerId: string;
  defenderId: string;
  weaponType: WeaponType;
  damage: number;
  remainingHp: number;
  timestamp: number;
  serverTick: number;
}

export interface MatchStatsSummary {
  winnerId: string;
  winnerName: string;
  winnerTeam?: Team;
  loserName: string;
  mode: GameMode;
  damageDealt: number;
  damageReceived: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  kills: number;
  matchDuration: number;
}
