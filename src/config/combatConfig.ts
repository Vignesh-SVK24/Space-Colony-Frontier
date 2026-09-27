/**
 * Centralized Combat Configuration
 * All weapon damages, speeds, cooldowns, and arena parameters
 */
export const COMBAT_CONFIG = {
  // Ship Vitals
  MAX_HP: 100,
  LOW_HP_THRESHOLD: 35,

  // Bullet / Plasma Projectile Weapon
  BULLET_DAMAGE: 10,
  BULLET_SPEED: 145,
  BULLET_COOLDOWN: 0.45, // seconds
  BULLET_HIT_RADIUS: 4.8, // forgiving collision detection radius (combat hitbox)
  BULLET_HITBOX_RADIUS: 4.8, // alias
  HITBOX_RADIUS: 4.8, // dedicated combat hitbox radius

  // Aim Assist & Lead Indicator
  AIM_ASSIST_ENABLED: true,
  AIM_ASSIST_ANGLE: 0.08, // ~4.6 degrees cone
  AIM_ASSIST_MAX_DIST: 200,

  // Laser Beam Weapon
  LASER_DAMAGE: 20,
  LASER_RANGE: 220, // max beam range in world units
  LASER_COOLDOWN: 5.0, // 5-second recharge requirement
  LASER_BEAM_DURATION: 0.7, // visible beam sustain time in seconds
  LASER_AIM_CONE: 0.12, // ~6.9 degrees tolerance

  // Arena Physics & Boundaries
  ARENA_RADIUS: 300,
  BOUNDARY_WARNING_MARGIN: 50, // triggers warning when dist > 250
  SPAWN_PROTECTION_TIME: 2.0, // seconds
  
  // Flight & Movement
  SHIP_CRUISE_SPEED: 30,
  SHIP_MAX_SPEED: 50,
  SHIP_BOOST_SPEED: 95,
  SHIP_MIN_SPEED: -15,
  COLLISION_DAMAGE: 15
} as const;

export type CombatDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface DifficultyConfig {
  reactionDelay: number; // seconds
  reactionTime: number; // alias
  aimError: number; // radians of angular error
  accuracySpread: number; // aim inaccuracy spread
  firingInterval: number; // interval between blaster shots in seconds
  dodgeProbability: number; // 0 to 1
  evasionChance: number; // alias
  retreatHpThreshold: number; // HP level where AI seeks cover
  coverHealthThreshold: number; // alias
  laserCooldownMultiplier: number;
  useLaser: boolean;
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
    retreatHpThreshold: 25,
    coverHealthThreshold: 25,
    laserCooldownMultiplier: 1.8,
    useLaser: false
  },
  NORMAL: {
    reactionDelay: 0.65,
    reactionTime: 0.65,
    aimError: 0.07,
    accuracySpread: 0.07,
    firingInterval: 1.5,
    dodgeProbability: 0.55,
    evasionChance: 0.55,
    retreatHpThreshold: 40,
    coverHealthThreshold: 40,
    laserCooldownMultiplier: 1.0,
    useLaser: true
  },
  HARD: {
    reactionDelay: 0.25,
    reactionTime: 0.25,
    aimError: 0.02,
    accuracySpread: 0.02,
    firingInterval: 0.85,
    dodgeProbability: 0.8,
    evasionChance: 0.8,
    retreatHpThreshold: 55,
    coverHealthThreshold: 55,
    laserCooldownMultiplier: 1.0,
    useLaser: true
  }
};

