/**
 * Space Colony: Frontier - Centralized Shared Game Configuration
 * Shared between Server and Client for strict authoritative combat synchronization.
 */

export const GAME_PROTOCOL_VERSION = '2.0.0';

export const GAME_CONFIG = {
  // Arena Boundaries & Environment
  ARENA_RADIUS: 300,
  ARENA_BOUNDARY_WARNING_MARGIN: 45,
  SPAWN_PROTECTION_TIME_MS: 2000,
  COUNTDOWN_SECONDS: 3,

  // Player Spacecraft Vitals
  MAX_HP: 250,
  INITIAL_HP: 250,
  MAX_PLAYERS: 4,

  // Weapon 1: Authoritative Rapid Plasma Bullet
  BULLET_DAMAGE: 2,
  BULLET_FIRE_INTERVAL_MS: 100, // 0.1s minimum server interval
  BULLET_MAGAZINE_SIZE: 30,
  BULLET_RELOAD_MS: 2000, // 2.0s automatic reload
  BULLET_SPEED: 180,
  BULLET_LIFETIME_MS: 2200,
  BULLET_MAX_DISTANCE: 350,
  BULLET_HITBOX_RADIUS: 5.2, // 10-15% forgiving combat hitbox

  // Weapon 2: Directed Laser Beam
  LASER_DAMAGE: 12,
  LASER_RECHARGE_MS: 3000, // 3.0s recharge interval
  LASER_RANGE: 260,
  LASER_AIM_CONE: 0.12, // ~6.9 degrees cone tolerance
  LASER_BEAM_DURATION_MS: 600,

  // Weapon 3: Special High-Yield Solar Beam
  SOLAR_DAMAGE: 30,
  SOLAR_RECHARGE_MS: 10000, // 10.0s recharge interval
  SOLAR_RANGE: 320,
  SOLAR_AIM_CONE: 0.08, // ~4.6 degrees narrow beam tolerance
  SOLAR_BEAM_DURATION_MS: 900,

  // Aim Assist & Lead Indicator
  AIM_ASSIST_ENABLED: true,
  AIM_ASSIST_ANGLE: 0.08,
  AIM_ASSIST_MAX_DIST: 240,

  // Ship Physics
  SHIP_PHYSICS: {
    maxSpeed: 52,
    boostSpeed: 96,
    minSpeed: -15,
    yawSpeed: 1.6,
    pitchSpeed: 1.6,
    bankFactor: 0.6,
    dampingLinear: 0.95,
    verticalMaxSpeed: 30,
    collisionDamage: 15
  },

  // Network Simulation
  SERVER_TICK_RATE: 30, // 30Hz fixed simulation loop
  RECONNECT_TIMEOUT_MS: 15000 // 15s reconnect grace period
} as const;

export type GameMode = '1v1' | 'FFA' | '2v2';
export type Team = 'A' | 'B' | 'NONE';
export type BattleColor = 'yellow' | 'blue' | 'red' | 'green';
export type RoomStatus = 'WAITING' | 'LOBBY' | 'READY' | 'COUNTDOWN' | 'BATTLE' | 'FINISHED' | 'CLOSED';
export type WeaponType = 'BULLET' | 'LASER' | 'SOLAR_BEAM' | 'COLLISION';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}
