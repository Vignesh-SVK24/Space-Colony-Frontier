import { RoomManager } from './RoomManager.js';
import { CombatSystem } from './CombatSystem.js';
import { CollisionSystem } from './CollisionSystem.js';
import { PHYSICS, ARENA_RADIUS, GameSnapshot, RoomState } from './types.js';
import { Server } from 'socket.io';

const TICK_RATE = 60;
const TICK_DT = 1 / TICK_RATE;

export class GameLoop {
    private roomManager: RoomManager;
    private combatSystem: CombatSystem;
    private collisionSystem: CollisionSystem;
    private io: Server;
    private interval: NodeJS.Timeout | null = null;

    constructor(io: Server, roomManager: RoomManager, combatSystem: CombatSystem, collisionSystem: CollisionSystem) {
        this.io = io;
        this.roomManager = roomManager;
        this.combatSystem = combatSystem;
        this.collisionSystem = collisionSystem;
    }

    start() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.tick(), 1000 / TICK_RATE);
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private tick() {
        const rooms = this.roomManager.getRooms();
        for (const room of rooms) {
            if (room.state === RoomState.BATTLE) {
                room.tickCount = (room.tickCount || 0) + 1;
                this.updatePhysics(room, TICK_DT);
                this.collisionSystem.updateCollisions(room);
                this.combatSystem.updateProjectiles(room, TICK_DT);
                
                // Broadcast authoritative 60Hz snapshot
                const snapshot: GameSnapshot = {
                    players: Object.fromEntries(room.players.entries()),
                    projectiles: room.projectiles,
                    serverTick: room.tickCount,
                    timestamp: Date.now()
                };
                
                this.io.to(room.id).emit('game_state', snapshot);
            }
        }
    }

    private updatePhysics(room: any, dt: number) {
        for (const player of room.players.values()) {
            if (player.hp <= 0) continue;
            
            const input = player.lastInput || {
                thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false
            };
            
            // 1. Rotation integration (Euler YXZ: pitch=x, yaw=y, roll=z)
            player.rotation.y += (input.yaw || 0) * PHYSICS.yawSpeed * dt;
            player.rotation.x = Math.max(-1.3, Math.min(1.3, player.rotation.x + (input.pitch || 0) * PHYSICS.pitchSpeed * dt));
            
            // 2. Compute Direction Vectors matching Three.js Euler convention
            const cosP = Math.cos(player.rotation.x);
            const sinP = Math.sin(player.rotation.x);
            const cosY = Math.cos(player.rotation.y);
            const sinY = Math.sin(player.rotation.y);
            
            // Forward vector: positive Z in local frame rotated by Euler YXZ
            const forward = {
                x: sinY * cosP,
                y: -sinP,
                z: cosY * cosP
            };

            // Up vector: positive Y in local frame
            const up = {
                x: sinY * sinP,
                y: cosP,
                z: cosY * sinP
            };
            
            // 3. Thrust & Velocity targets
            let forwardSpeed = 0;
            if (input.thrust > 0) {
                forwardSpeed = (input.boost ? PHYSICS.boostSpeed : PHYSICS.maxSpeed) * Math.min(1, input.thrust);
            } else if (input.thrust < 0) {
                forwardSpeed = PHYSICS.minSpeed * Math.min(1, Math.abs(input.thrust));
            }
            
            const verticalSpeed = (input.vertical || 0) * PHYSICS.verticalMaxSpeed;
            
            const targetVelX = forward.x * forwardSpeed + up.x * verticalSpeed;
            const targetVelY = forward.y * forwardSpeed + up.y * verticalSpeed;
            const targetVelZ = forward.z * forwardSpeed + up.z * verticalSpeed;
            
            const accel = input.brake ? 8.0 : (input.boost ? 4.5 : 3.0);
            player.velocity.x += (targetVelX - player.velocity.x) * accel * dt;
            player.velocity.y += (targetVelY - player.velocity.y) * accel * dt;
            player.velocity.z += (targetVelZ - player.velocity.z) * accel * dt;
            
            // 4. Aerodynamic Damping
            const damp = Math.pow(PHYSICS.dampingLinear, dt * 60);
            player.velocity.x *= damp;
            player.velocity.y *= damp;
            player.velocity.z *= damp;
            
            // 5. Integrate Position
            player.position.x += player.velocity.x * dt;
            player.position.y += player.velocity.y * dt;
            player.position.z += player.velocity.z * dt;
            
            // 6. Arena Boundary Enforcement (300m spherical forcefield)
            const distSq = player.position.x ** 2 + player.position.y ** 2 + player.position.z ** 2;
            if (distSq > ARENA_RADIUS ** 2) {
                const dist = Math.sqrt(distSq);
                const nx = player.position.x / dist;
                const ny = player.position.y / dist;
                const nz = player.position.z / dist;
                
                player.position.x = nx * (ARENA_RADIUS - 0.5);
                player.position.y = ny * (ARENA_RADIUS - 0.5);
                player.position.z = nz * (ARENA_RADIUS - 0.5);
                
                // Deflect velocity on boundary contact
                const dot = player.velocity.x * nx + player.velocity.y * ny + player.velocity.z * nz;
                if (dot > 0) {
                    player.velocity.x -= dot * nx * 1.5;
                    player.velocity.y -= dot * ny * 1.5;
                    player.velocity.z -= dot * nz * 1.5;
                }
            }
        }
    }
}
