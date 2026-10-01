/**
 * Space Colony: Frontier - Centralized Combat Configuration
 * All weapon damages, speeds, cooldowns, and arena parameters
 * Strict authoritative combat synchronization (250 HP base).
 */
import { GAME_CONFIG, GameMode, Team, BattleColor, WeaponType } from '../shared/gameConfig';

export { GAME_CONFIG };
export type { GameMode, Team, BattleColor, WeaponType };

export const COMBAT_CONFIG = {
  // Ship Vitals
  MAX_HP: GAME_CONFIG.MAX_HP, // 250 HP
  INITIAL_HP: GAME_CONFIG.INITIAL_HP,
  LOW_HP_THRESHOLD: 75,

  // Weapon 1: Rapid Plasma Bullet
  BULLET_DAMAGE: GAME_CONFIG.BULLET_DAMAGE, // 2 HP
  BULLET_FIRE_INTERVAL: GAME_CONFIG.BULLET_FIRE_INTERVAL_MS / 1000, // 0.1s
  BULLET_MAGAZINE_SIZE: GAME_CONFIG.BULLET_MAGAZINE_SIZE, // 30
  BULLET_RELOAD_TIME: GAME_CONFIG.BULLET_RELOAD_MS / 1000, // 2.0s
  BULLET_SPEED: GAME_CONFIG.BULLET_SPEED, // 180
  BULLET_HIT_RADIUS: GAME_CONFIG.BULLET_HITBOX_RADIUS, // 5.2
  BULLET_HITBOX_RADIUS: GAME_CONFIG.BULLET_HITBOX_RADIUS,
  HITBOX_RADIUS: GAME_CONFIG.BULLET_HITBOX_RADIUS,

  // Weapon 2: Directed Laser Beam
  LASER_DAMAGE: GAME_CONFIG.LASER_DAMAGE, // 12 HP
  LASER_RANGE: GAME_CONFIG.LASER_RANGE, // 260
  LASER_COOLDOWN: GAME_CONFIG.LASER_RECHARGE_MS / 1000, // 3.0s
  LASER_BEAM_DURATION: GAME_CONFIG.LASER_BEAM_DURATION_MS / 1000,
  LASER_AIM_CONE: GAME_CONFIG.LASER_AIM_CONE,

  // Weapon 3: Special High-Yield Solar Beam
  SOLAR_DAMAGE: GAME_CONFIG.SOLAR_DAMAGE, // 30 HP
  SOLAR_RANGE: GAME_CONFIG.SOLAR_RANGE, // 320
  SOLAR_COOLDOWN: GAME_CONFIG.SOLAR_RECHARGE_MS / 1000, // 10.0s
  SOLAR_BEAM_DURATION: GAME_CONFIG.SOLAR_BEAM_DURATION_MS / 1000,
  SOLAR_AIM_CONE: GAME_CONFIG.SOLAR_AIM_CONE,

  // Aim Assist & Lead Indicator
  AIM_ASSIST_ENABLED: GAME_CONFIG.AIM_ASSIST_ENABLED,
  AIM_ASSIST_ANGLE: GAME_CONFIG.AIM_ASSIST_ANGLE,
  AIM_ASSIST_MAX_DIST: GAME_CONFIG.AIM_ASSIST_MAX_DIST,

  // Arena Physics & Boundaries
  ARENA_RADIUS: GAME_CONFIG.ARENA_RADIUS, // 300
  BOUNDARY_WARNING_MARGIN: GAME_CONFIG.ARENA_BOUNDARY_WARNING_MARGIN,
  SPAWN_PROTECTION_TIME: GAME_CONFIG.SPAWN_PROTECTION_TIME_MS / 1000,
  
  // Flight & Movement
  SHIP_CRUISE_SPEED: 32,
  SHIP_MAX_SPEED: GAME_CONFIG.SHIP_PHYSICS.maxSpeed,
  SHIP_BOOST_SPEED: GAME_CONFIG.SHIP_PHYSICS.boostSpeed,
  SHIP_MIN_SPEED: GAME_CONFIG.SHIP_PHYSICS.minSpeed,
  COLLISION_DAMAGE: GAME_CONFIG.SHIP_PHYSICS.collisionDamage
} as const;

export type CombatDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface DifficultyConfig {
  reactionDelay: number;
  reactionTime: number;
  aimError: number;
  accuracySpread: number;
  firingInterval: number;
  dodgeProbability: number;
  evasionChance: number;
  retreatHpThreshold: number;
  coverHealthThreshold: number;
  laserCooldownMultiplier: number;
  useLaser: boolean;
  useSolar: boolean;
}

export const AI_DIFFICULTY_SETTINGS: Record<CombatDifficulty, DifficultyConfig> = {
  EASY: {
    reactionDelay: 1.2,
    reactionTime: 1.2,
    aimError: 0.14,
    accuracySpread: 0.14,
    firingInterval: 2.6,
    dodgeProbability: 0.2,
    evasionChance: 0.2,
    retreatHpThreshold: 60,
    coverHealthThreshold: 60,
    laserCooldownMultiplier: 1.8,
    useLaser: false,
    useSolar: false
  },
  NORMAL: {
    reactionDelay: 0.65,
    reactionTime: 0.65,
    aimError: 0.07,
    accuracySpread: 0.07,
    firingInterval: 1.2,
    dodgeProbability: 0.55,
    evasionChance: 0.55,
    retreatHpThreshold: 90,
    coverHealthThreshold: 90,
    laserCooldownMultiplier: 1.0,
    useLaser: true,
    useSolar: true
  },
  HARD: {
    reactionDelay: 0.25,
    reactionTime: 0.25,
    aimError: 0.02,
    accuracySpread: 0.02,
    firingInterval: 0.5,
    dodgeProbability: 0.8,
    evasionChance: 0.8,
    retreatHpThreshold: 120,
    coverHealthThreshold: 120,
    laserCooldownMultiplier: 1.0,
    useLaser: true,
    useSolar: true
  }
};
