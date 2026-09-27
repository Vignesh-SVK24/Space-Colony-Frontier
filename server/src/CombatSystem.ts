import { Room, Projectile, PlayerState, Vector3, RoomState, COMBAT, LaserEvent, DamageEvent } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { ARENA_OBSTACLES, checkObstacleRaycast, checkSegmentSphereCollision } from './arenaObstacles.js';

export class CombatSystem {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    /**
     * Compute forward vector from Euler angles (YXZ: pitch=x, yaw=y, roll=z)
     * Matches Three.js: (0, 0, 1).applyEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'))
     */
    getForwardVector(rot: { x: number; y: number; z: number }): Vector3 {
        const cosP = Math.cos(rot.x);
        const sinP = Math.sin(rot.x);
        const cosY = Math.cos(rot.y);
        const sinY = Math.sin(rot.y);

        // Positive Z forward with YXZ Euler order:
        // x = sin(y) * cos(x)
        // y = -sin(x)
        // z = cos(y) * cos(x)
        return {
            x: sinY * cosP,
            y: -sinP,
            z: cosY * cosP
        };
    }

    shoot(
        room: Room,
        playerId: string,
        clientOrigin?: { x: number; y: number; z: number },
        clientDir?: { x: number; y: number; z: number }
    ) {
        if (room.state !== RoomState.BATTLE) return;

        const player = room.players.get(playerId);
        if (!player || player.hp <= 0) return;

        const now = Date.now();
        if (now - player.lastShootTime < COMBAT.BULLET_COOLDOWN) return;

        player.lastShootTime = now;

        // Determine firing origin: validate within 6m of player server position
        let origin: Vector3 = { ...player.position };
        if (clientOrigin) {
            const dx = clientOrigin.x - player.position.x;
            const dy = clientOrigin.y - player.position.y;
            const dz = clientOrigin.z - player.position.z;
            if (dx * dx + dy * dy + dz * dz < 36) {
                origin = { ...clientOrigin };
            }
        }

        // Determine firing direction
        let dir: Vector3;
        if (clientDir) {
            const len = Math.sqrt(clientDir.x ** 2 + clientDir.y ** 2 + clientDir.z ** 2);
            if (len > 0.001) {
                dir = { x: clientDir.x / len, y: clientDir.y / len, z: clientDir.z / len };
            } else {
                dir = this.getForwardVector(player.rotation);
            }
        } else {
            dir = this.getForwardVector(player.rotation);
        }

        // Apply soft aim assist if target is within assist cone
        if (COMBAT.AIM_ASSIST_ENABLED) {
            let closestOpponent: PlayerState | null = null;
            let closestDist = COMBAT.AIM_ASSIST_MAX_DIST;

            for (const [id, opp] of room.players.entries()) {
                if (id === playerId || opp.hp <= 0) continue;
                const toX = opp.position.x - origin.x;
                const toY = opp.position.y - origin.y;
                const toZ = opp.position.z - origin.z;
                const dist = Math.sqrt(toX * toX + toY * toY + toZ * toZ);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestOpponent = opp;
                }
            }

            if (closestOpponent) {
                const toX = (closestOpponent.position.x - origin.x) / closestDist;
                const toY = (closestOpponent.position.y - origin.y) / closestDist;
                const toZ = (closestOpponent.position.z - origin.z) / closestDist;

                const dot = dir.x * toX + dir.y * toY + dir.z * toZ;
                const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

                // If within aim cone, gently correct trajectory toward opponent
                if (angle < COMBAT.AIM_ASSIST_ANGLE) {
                    const pull = 0.55; // 55% pull towards target
                    dir = {
                        x: dir.x * (1 - pull) + toX * pull,
                        y: dir.y * (1 - pull) + toY * pull,
                        z: dir.z * (1 - pull) + toZ * pull
                    };
                    const len = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);
                    dir.x /= len;
                    dir.y /= len;
                    dir.z /= len;
                }
            }
        }

        const projectile: Projectile = {
            id: uuidv4(),
            shooterId: playerId,
            position: { ...origin },
            prevPosition: { ...origin },
            velocity: {
                x: dir.x * COMBAT.BULLET_SPEED,
                y: dir.y * COMBAT.BULLET_SPEED,
                z: dir.z * COMBAT.BULLET_SPEED
            },
            spawnTime: now
        };

        room.projectiles.push(projectile);
    }

    fireLaser(
        room: Room,
        playerId: string,
        clientOrigin?: { x: number; y: number; z: number },
        clientDir?: { x: number; y: number; z: number }
    ) {
        if (room.state !== RoomState.BATTLE) return;

        const player = room.players.get(playerId);
        if (!player || player.hp <= 0) return;

        const now = Date.now();
        if (now - player.lastLaserTime < COMBAT.LASER_COOLDOWN) {
            // Laser still recharging!
            const remaining = ((COMBAT.LASER_COOLDOWN - (now - player.lastLaserTime)) / 1000).toFixed(1);
            this.io.to(playerId).emit('laser_cooldown', { remaining });
            return;
        }

        player.lastLaserTime = now;

        // Determine laser origin
        let origin: Vector3 = { ...player.position };
        if (clientOrigin) {
            const dx = clientOrigin.x - player.position.x;
            const dy = clientOrigin.y - player.position.y;
            const dz = clientOrigin.z - player.position.z;
            if (dx * dx + dy * dy + dz * dz < 36) {
                origin = { ...clientOrigin };
            }
        }

        // Determine laser direction
        let dir: Vector3;
        if (clientDir) {
            const len = Math.sqrt(clientDir.x ** 2 + clientDir.y ** 2 + clientDir.z ** 2);
            if (len > 0.001) {
                dir = { x: clientDir.x / len, y: clientDir.y / len, z: clientDir.z / len };
            } else {
                dir = this.getForwardVector(player.rotation);
            }
        } else {
            dir = this.getForwardVector(player.rotation);
        }

        const maxEnd: Vector3 = {
            x: origin.x + dir.x * COMBAT.LASER_RANGE,
            y: origin.y + dir.y * COMBAT.LASER_RANGE,
            z: origin.z + dir.z * COMBAT.LASER_RANGE
        };

        // Raycast against arena obstacles
        const raycast = checkObstacleRaycast(
            origin.x, origin.y, origin.z,
            maxEnd.x, maxEnd.y, maxEnd.z
        );

        let actualEnd: [number, number, number] = raycast.blocked && raycast.hitPoint
            ? raycast.hitPoint
            : [maxEnd.x, maxEnd.y, maxEnd.z];
        let blockedByObstacle = raycast.blocked;
        let hitTargetId: string | undefined = undefined;

        // Test opponent intersection
        for (const [targetId, opp] of room.players.entries()) {
            if (targetId === playerId || opp.hp <= 0) continue;

            const toX = opp.position.x - origin.x;
            const toY = opp.position.y - origin.y;
            const toZ = opp.position.z - origin.z;
            const dist = Math.sqrt(toX * toX + toY * toY + toZ * toZ);

            if (dist <= COMBAT.LASER_RANGE) {
                const normX = toX / dist;
                const normY = toY / dist;
                const normZ = toZ / dist;

                const dot = dir.x * normX + dir.y * normY + dir.z * normZ;
                const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

                // Check if target is inside laser aim cone (~6.9 degrees)
                if (angle < COMBAT.LASER_AIM_CONE) {
                    // Check if obstacle was in the way before reaching the opponent
                    if (!blockedByObstacle || (raycast.distance > dist)) {
                        actualEnd = [opp.position.x, opp.position.y, opp.position.z];
                        hitTargetId = targetId;
                        blockedByObstacle = false;
                        break;
                    }
                }
            }
        }

        // Broadcast laser event to both clients
        const laserEvent: LaserEvent = {
            shooterId: playerId,
            start: [origin.x, origin.y, origin.z],
            end: actualEnd,
            blocked: blockedByObstacle,
            hitTargetId,
            color: player.color,
            timestamp: now
        };

        this.io.to(room.id).emit('laser_fired', laserEvent);

        // Apply authoritative damage if opponent struck
        if (hitTargetId) {
            this.applyDamage(room, hitTargetId, COMBAT.LASER_DAMAGE, 'laser', playerId);
        }
    }

    updateProjectiles(room: Room, dt: number) {
        const now = Date.now();
        const remainingProjectiles: Projectile[] = [];

        for (const proj of room.projectiles) {
            if (now - proj.spawnTime > COMBAT.BULLET_LIFETIME) {
                continue;
            }

            // Save previous position before advancing
            proj.prevPosition = { ...proj.position };

            // Advance projectile
            proj.position.x += proj.velocity.x * dt;
            proj.position.y += proj.velocity.y * dt;
            proj.position.z += proj.velocity.z * dt;

            // Arena boundary check (300m)
            const distSq = proj.position.x ** 2 + proj.position.y ** 2 + proj.position.z ** 2;
            if (distSq > 300 ** 2) {
                continue;
            }

            // 1. Swept collision with arena obstacles
            let hitObstacle = false;
            for (const obs of ARENA_OBSTACLES) {
                const coll = checkSegmentSphereCollision(
                    proj.prevPosition.x, proj.prevPosition.y, proj.prevPosition.z,
                    proj.position.x, proj.position.y, proj.position.z,
                    obs.position[0], obs.position[1], obs.position[2],
                    obs.radius
                );
                if (coll.hit) {
                    hitObstacle = true;
                    break;
                }
            }
            if (hitObstacle) {
                continue; // Bullet absorbed by asteroid/station!
            }

            // 2. Swept collision with players (eliminates fast bullet tunneling)
            let hitPlayer = false;
            for (const [targetId, target] of room.players.entries()) {
                if (targetId === proj.shooterId || target.hp <= 0) continue;

                const coll = checkSegmentSphereCollision(
                    proj.prevPosition.x, proj.prevPosition.y, proj.prevPosition.z,
                    proj.position.x, proj.position.y, proj.position.z,
                    target.position.x, target.position.y, target.position.z,
                    COMBAT.BULLET_HITBOX_RADIUS
                );

                if (coll.hit) {
                    hitPlayer = true;
                    this.applyDamage(room, targetId, COMBAT.BULLET_DAMAGE, 'bullet', proj.shooterId);
                    break;
                }
            }

            if (!hitPlayer) {
                remainingProjectiles.push(proj);
            }
        }

        room.projectiles = remainingProjectiles;
    }

    applyDamage(
        room: Room,
        targetId: string,
        damage: number,
        weapon: 'bullet' | 'laser' | 'collision',
        attackerId: string
    ) {
        const target = room.players.get(targetId);
        if (!target || target.hp <= 0) return;

        // Spawn protection check (2.0s after match start)
        const now = Date.now();
        if (target.spawnTime && now - target.spawnTime < COMBAT.SPAWN_PROTECTION_TIME) {
            return;
        }

        target.hp = Math.max(0, target.hp - damage);

        const damageEvent: DamageEvent = {
            targetId,
            attackerId,
            damage,
            newHp: target.hp,
            weapon,
            timestamp: now
        };

        this.io.to(room.id).emit('player_hit', damageEvent);
        this.io.to(room.id).emit('damage_applied', damageEvent);

        if (target.hp <= 0) {
            room.state = RoomState.FINISHED;
            room.winnerId = attackerId;

            this.io.to(room.id).emit('player_eliminated', {
                eliminatedId: targetId,
                winnerId: attackerId
            });

            const matchDuration = Math.max(1, Math.floor((now - (room.battleStartTime || room.createdAt)) / 1000));
            this.io.to(room.id).emit('match_end', {
                winnerId: attackerId,
                loserId: targetId,
                stats: {
                    damageDealt: 100,
                    matchDuration
                }
            });
        }
    }
}
