export type BattleColor = 'yellow' | 'blue' | 'red' | 'green';
export type RoomStatus = 'WAITING' | 'COUNTDOWN' | 'BATTLE' | 'FINISHED';
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
  name: string;
  color: BattleColor;
  position: [number, number, number];
  rotation: [number, number, number]; // euler YXZ
  velocity: [number, number, number];
  hp: number;
  maxHp: number;
  alive: boolean;
  throttle: number;
  isBoosting: boolean;
}

export interface ProjectileState {
  id: string;
  ownerId: string;
  position: [number, number, number];
  direction: [number, number, number];
  color: BattleColor;
  createdAt: number;
}

export interface LaserEvent {
  shooterId: string;
  start: [number, number, number];
  end: [number, number, number];
  blocked: boolean;
  hitTargetId?: string;
  color: BattleColor;
  timestamp: number;
}

export interface DamageEvent {
  targetId: string;
  attackerId: string;
  damage: number;
  newHp: number;
  weapon: 'bullet' | 'laser' | 'collision';
  timestamp: number;
}

export interface LeadIndicatorInfo {
  worldPos: [number, number, number];
  distance: number;
  visible: boolean;
}

export interface RoomInfo {
  code: string;
  players: { id: string; name: string; color: BattleColor }[];
  status: RoomStatus;
}

export interface GameSnapshot {
  players: PlayerState[];
  projectiles: ProjectileState[];
  timestamp: number;
  roomStatus: RoomStatus;
}

export interface MatchStats {
  winner: string;
  winnerName: string;
  loserName: string;
  damageDealt: number;
  shotsHit: number;
  shotsFired: number;
  accuracy: number;
  matchDuration: number;
}

export interface HitEvent {
  targetId: string;
  shooterId: string;
  damage: number;
  newHp: number;
  weapon?: 'bullet' | 'laser' | 'collision';
}
