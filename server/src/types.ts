export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PlayerInput {
    thrust: number; // -1 to 1
    yaw: number; // -1 to 1
    pitch: number; // -1 to 1
    roll: number; // -1 to 1
    vertical: number; // -1 to 1
    boost: boolean;
    brake: boolean;
}

export interface PlayerState {
    id: string;
    name: string;
    color: string;
    position: Vector3;
    rotation: { x: number; y: number; z: number }; // Euler YXZ (pitch: x, yaw: y, roll: z)
    velocity: Vector3;
    hp: number;
    maxHp: number;
    score: number;
    lastInput: PlayerInput;
    lastShootTime: number;
    lastLaserTime: number;
    spawnTime: number;
    ready: boolean;
}

export interface Projectile {
    id: string;
    shooterId: string;
    position: Vector3;
    prevPosition: Vector3; // for swept continuous collision
    velocity: Vector3;
    spawnTime: number;
}

export interface LaserEvent {
    shooterId: string;
    start: [number, number, number];
    end: [number, number, number];
    blocked: boolean;
    hitTargetId?: string;
    color: string;
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

export interface GameSnapshot {
    players: Record<string, PlayerState>;
    projectiles: Projectile[];
    timestamp: number;
}

export enum RoomState {
    WAITING = 'WAITING',
    COUNTDOWN = 'COUNTDOWN',
    BATTLE = 'BATTLE',
    FINISHED = 'FINISHED'
}

export interface Room {
    id: string;
    code: string;
    state: RoomState;
    players: Map<string, PlayerState>;
    projectiles: Projectile[];
    createdAt: number;
    battleStartTime?: number;
    winnerId?: string;
}

export interface ShipPhysics {
    maxSpeed: number;
    boostSpeed: number;
    minSpeed: number;
    yawSpeed: number;
    pitchSpeed: number;
    bankFactor: number;
    dampingLinear: number;
    verticalMaxSpeed: number;
}

export const PHYSICS: ShipPhysics = {
    maxSpeed: 50,
    boostSpeed: 95,
    minSpeed: -15,
    yawSpeed: 1.6,
    pitchSpeed: 1.6,
    bankFactor: 0.6,
    dampingLinear: 0.95,
    verticalMaxSpeed: 30
};

export const ARENA_RADIUS = 300;

export const COMBAT = {
    MAX_HP: 100,
    BULLET_DAMAGE: 10,
    BULLET_SPEED: 145,
    BULLET_COOLDOWN: 450, // ms
    BULLET_LIFETIME: 2200, // ms
    BULLET_HITBOX_RADIUS: 4.5, // forgiving combat volume

    LASER_DAMAGE: 20,
    LASER_RANGE: 220,
    LASER_COOLDOWN: 5000, // 5.0 seconds
    LASER_AIM_CONE: 0.12, // ~6.9 degrees tolerance

    AIM_ASSIST_ENABLED: true,
    AIM_ASSIST_ANGLE: 0.08, // ~4.6 degrees
    AIM_ASSIST_MAX_DIST: 200,

    SPAWN_PROTECTION_TIME: 2000, // ms
    COUNTDOWN_SECONDS: 3
};
