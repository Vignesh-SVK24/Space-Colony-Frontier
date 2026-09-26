import { Room, Vector3 } from './types.js';

const SHIP_RADIUS = 2.0;

export class CollisionSystem {
    
    updateCollisions(room: Room) {
        // Check ship-ship collisions
        const players = Array.from(room.players.values());
        
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const p1 = players[i];
                const p2 = players[j];
                
                if (p1.hp <= 0 || p2.hp <= 0) continue;

                const dx = p2.position.x - p1.position.x;
                const dy = p2.position.y - p1.position.y;
                const dz = p2.position.z - p1.position.z;
                
                const distSq = dx*dx + dy*dy + dz*dz;
                const min_dist = SHIP_RADIUS * 2;
                
                if (distSq < min_dist * min_dist && distSq > 0.0001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = min_dist - dist;
                    
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;
                    
                    // Simple resolution: move apart by half overlap
                    const pushX = nx * overlap * 0.5;
                    const pushY = ny * overlap * 0.5;
                    const pushZ = nz * overlap * 0.5;
                    
                    p1.position.x -= pushX;
                    p1.position.y -= pushY;
                    p1.position.z -= pushZ;
                    
                    p2.position.x += pushX;
                    p2.position.y += pushY;
                    p2.position.z += pushZ;
                    
                    // Simple bounce
                    const vdx = p2.velocity.x - p1.velocity.x;
                    const vdy = p2.velocity.y - p1.velocity.y;
                    const vdz = p2.velocity.z - p1.velocity.z;
                    
                    const dot = vdx*nx + vdy*ny + vdz*nz;
                    if (dot < 0) { // Moving towards each other
                        const restitution = 0.5;
                        const impulse = -(1 + restitution) * dot * 0.5; // mass 1
                        
                        p1.velocity.x -= nx * impulse;
                        p1.velocity.y -= ny * impulse;
                        p1.velocity.z -= nz * impulse;
                        
                        p2.velocity.x += nx * impulse;
                        p2.velocity.y += ny * impulse;
                        p2.velocity.z += nz * impulse;
                    }
                }
            }
        }
    }
}
