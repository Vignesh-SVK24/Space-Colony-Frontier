import { Room, Projectile, PlayerState, Vector3, RoomState } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';

const PROJECTILE_SPEED = 120;
const PROJECTILE_LIFETIME = 2000; // ms
const COOLDOWN = 300; // ms
const DAMAGE = 10;
const SHIP_RADIUS = 2;

export class CombatSystem {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    shoot(room: Room, playerId: string) {
        if (room.state !== 'BATTLE') return;
        
        const player = room.players.get(playerId);
        if (!player) return;

        const now = Date.now();
        if (now - player.lastShootTime < COOLDOWN) return;

        player.lastShootTime = now;

        // Calculate forward vector from rotation
        const forward = this.getForwardVector(player.rotation);
        
        const projectile: Projectile = {
            id: uuidv4(),
            shooterId: playerId,
            position: { ...player.position },
            velocity: {
                x: forward.x * PROJECTILE_SPEED,
                y: forward.y * PROJECTILE_SPEED,
                z: forward.z * PROJECTILE_SPEED
            },
            spawnTime: now
        };

        room.projectiles.push(projectile);
    }

    updateProjectiles(room: Room, dt: number) {
        const now = Date.now();
        const remainingProjectiles: Projectile[] = [];

        for (const proj of room.projectiles) {
            if (now - proj.spawnTime > PROJECTILE_LIFETIME) {
                continue;
            }

            // Move projectile
            proj.position.x += proj.velocity.x * dt;
            proj.position.y += proj.velocity.y * dt;
            proj.position.z += proj.velocity.z * dt;

            // Check collision with players
            let hit = false;
            for (const [targetId, target] of room.players.entries()) {
                if (targetId === proj.shooterId) continue;
                if (target.hp <= 0) continue;

                if (this.checkSphereCollision(proj.position, target.position, SHIP_RADIUS)) {
                    hit = true;
                    target.hp -= DAMAGE;
                    
                    this.io.to(room.id).emit('player_hit', {
                        targetId,
                        shooterId: proj.shooterId,
                        damage: DAMAGE,
                        newHp: target.hp
                    });

                    if (target.hp <= 0) {
                        this.io.to(room.id).emit('player_eliminated', {
                            eliminatedId: targetId,
                            winnerId: proj.shooterId
                        });
                        room.state = RoomState.FINISHED;
                        this.io.to(room.id).emit('match_end', {
                            winnerId: proj.shooterId,
                            stats: {}
                        });
                    }
                    break;
                }
            }

            if (!hit) {
                remainingProjectiles.push(proj);
            }
        }

        room.projectiles = remainingProjectiles;
    }

    private getForwardVector(rotation: { x: number, y: number, z: number }): Vector3 {
        // Assuming standard Euler angles (YXZ or similar).
        // For a simple space sim, usually yaw is Y, pitch is X.
        const cosP = Math.cos(rotation.x);
        const sinP = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);

        return {
            x: -sinY * cosP,
            y: sinP,
            z: -cosY * cosP
        };
    }

    private checkSphereCollision(pos1: Vector3, pos2: Vector3, radius: number): boolean {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        return distSq <= (radius * radius);
    }
}
