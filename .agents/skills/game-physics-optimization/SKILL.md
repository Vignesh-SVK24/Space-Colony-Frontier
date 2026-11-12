---
name: game-physics-optimization
description: Server and client 3D collision, raycast, and projectile swept-collision optimization without weakening hit accuracy.
---

# Game Physics Optimization

## Purpose
Optimize obstacle raycasts, projectile sweeps, and ship-vs-asteroid collision checks across 4-player matches.

## Activation Conditions
- Modifying `arenaObstacles.ts`, `terrainPhysics.ts`, `ProjectileSystem.ts`, `LaserSystem.ts`, or `ServerPhysicsWorld.ts`.

## Workflow
1. **Early-Out Bounds**: Reject raycasts/collisions outside the 300m arena or using fast squared-distance checks before `Math.sqrt`.
2. **Simple Colliders**: Represent complex 3D asteroids/stations with bounding spheres for fast narrow-phase checks.
3. **Zero-Allocation Math**: Avoid creating temporary `{x, y, z}` or `Vector3` objects inside hot projectile loops.

## Constraints
- Projectiles and beams must never pass through physical cover obstacles.
- Ships must never tunnel through asteroids or escape the 300m boundary.

## Verification Checklist
- [ ] `terrainAndObstaclePhysics.test.ts` and `flightPhysics.test.ts` pass 100%.
- [ ] `combatHitDetectionDamage.test.ts` passes 100%.
