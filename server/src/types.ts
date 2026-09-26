export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PlayerInput {
    thrust: number; // 0 to 1
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
    rotation: { x: number, y: number, z: number };
    velocity: Vector3;
    hp: number;
    score: number;
    lastInput: PlayerInput;
    lastShootTime: number;
}

export interface Projectile {
    id: string;
    shooterId: string;
    position: Vector3;
    velocity: Vector3;
    spawnTime: number;
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
