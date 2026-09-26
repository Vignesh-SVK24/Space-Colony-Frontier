import { RoomManager } from './RoomManager.js';
import { CombatSystem } from './CombatSystem.js';
import { CollisionSystem } from './CollisionSystem.js';
import { PHYSICS, ARENA_RADIUS, GameSnapshot } from './types.js';
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
        this.interval = setInterval(() => this.tick(), 1000 / TICK_RATE);
    }
    
    stop() {
        if (this.interval) clearInterval(this.interval);
    }

    private tick() {
        const rooms = this.roomManager.getRooms();
        for (const room of rooms) {
            if (room.state === 'BATTLE') {
                this.updatePhysics(room, TICK_DT);
                this.collisionSystem.updateCollisions(room);
                this.combatSystem.updateProjectiles(room, TICK_DT);
                
                // Broadcast state
                const snapshot: GameSnapshot = {
                    players: Object.fromEntries(room.players.entries()),
                    projectiles: room.projectiles,
                    timestamp: Date.now()
                };
                
                this.io.to(room.id).emit('game_state', snapshot);
            }
        }
    }

    private updatePhysics(room: any, dt: number) {
        for (const player of room.players.values()) {
            if (player.hp <= 0) continue;
            
            const input = player.lastInput;
            
            // Rotation
            player.rotation.y += input.yaw * PHYSICS.yawSpeed * dt;
            player.rotation.x += input.pitch * PHYSICS.pitchSpeed * dt;
            
            // Forward vector
            const cosP = Math.cos(player.rotation.x);
            const sinP = Math.sin(player.rotation.x);
            const cosY = Math.cos(player.rotation.y);
            const sinY = Math.sin(player.rotation.y);
            
            const forward = {
                x: -sinY * cosP,
                y: sinP,
                z: -cosY * cosP
            };
            
            // Thrust
            let targetSpeed = 0;
            if (input.thrust > 0) {
                targetSpeed = input.boost ? PHYSICS.boostSpeed : PHYSICS.maxSpeed;
            } else if (input.brake) {
                targetSpeed = PHYSICS.minSpeed;
            }
            
            // Apply thrust (simple linear interpolation for velocity change)
            player.velocity.x += (forward.x * targetSpeed - player.velocity.x) * 2 * dt;
            player.velocity.y += (forward.y * targetSpeed - player.velocity.y) * 2 * dt;
            player.velocity.z += (forward.z * targetSpeed - player.velocity.z) * 2 * dt;
            
            // Apply damping
            player.velocity.x *= PHYSICS.dampingLinear;
            player.velocity.y *= PHYSICS.dampingLinear;
            player.velocity.z *= PHYSICS.dampingLinear;
            
            // Position
            player.position.x += player.velocity.x * dt;
            player.position.y += player.velocity.y * dt;
            player.position.z += player.velocity.z * dt;
            
            // Boundary enforcement
            const distSq = player.position.x**2 + player.position.y**2 + player.position.z**2;
            if (distSq > ARENA_RADIUS**2) {
                const dist = Math.sqrt(distSq);
                const nx = player.position.x / dist;
                const ny = player.position.y / dist;
                const nz = player.position.z / dist;
                
                player.position.x = nx * ARENA_RADIUS;
                player.position.y = ny * ARENA_RADIUS;
                player.position.z = nz * ARENA_RADIUS;
                
                // Reflect velocity
                const dot = player.velocity.x*nx + player.velocity.y*ny + player.velocity.z*nz;
                if (dot > 0) {
                    player.velocity.x -= 2 * dot * nx;
                    player.velocity.y -= 2 * dot * ny;
                    player.velocity.z -= 2 * dot * nz;
                }
            }
        }
    }
}
