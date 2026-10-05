import { describe, it, expect } from 'vitest';
import { getTerrainHeight, resolveTerrainCollision, raycastTerrain } from '../src/config/terrainPhysics';
import { checkObstacleRaycast, resolveShipMovementCollision, ARENA_OBSTACLES } from '../src/config/arenaObstacles';

describe('Planetary Terrain & Obstacle Physics', () => {
  it('calculates deterministic terrain elevation and crater features', () => {
    // Base level outside features (e.g. at (120, 80))
    const hBase = getTerrainHeight(120, 80);
    expect(hBase).toBeCloseTo(-125, 0);

    // Caloris Crater center should be significantly lower (depression)
    const hCrater = getTerrainHeight(65, -55);
    expect(hCrater).toBeLessThan(hBase - 15);

    // Volcanic Spine / Ridge crest should be significantly higher
    const hRidge = getTerrainHeight(-50, 55);
    expect(hRidge).toBeGreaterThan(hBase + 15);
  });

  it('prevents spaceship penetration below terrain surface', () => {
    // Attempt to position ship underground at y = -140 where terrain is at -125
    const undergroundY = -140;
    const res = resolveTerrainCollision(0, undergroundY, 0, 3.5);

    expect(res.collided).toBe(true);
    expect(res.resolvedY).toBeGreaterThanOrEqual(getTerrainHeight(0, 0) + 3.5);
  });

  it('stops and deflects spaceship when moving into an asteroid', () => {
    const titanAlpha = ARENA_OBSTACLES.find(o => o.id === 'obs_titan_alpha')!;
    expect(titanAlpha).toBeDefined();

    // Desired position directly inside the center of Titan Alpha
    const prevPos = { x: titanAlpha.position[0] + 35, y: titanAlpha.position[1], z: titanAlpha.position[2] };
    const insidePos = { x: titanAlpha.position[0], y: titanAlpha.position[1], z: titanAlpha.position[2] };

    const res = resolveShipMovementCollision(prevPos, insidePos, 3.6);
    expect(res.collided).toBe(true);
    expect(res.hitObstacle?.id).toBe(titanAlpha.id);

    // Resolved distance to asteroid center must be at least radius + shipRadius
    const dist = Math.hypot(
      res.position.x - titanAlpha.position[0],
      res.position.y - titanAlpha.position[1],
      res.position.z - titanAlpha.position[2]
    );
    expect(dist).toBeGreaterThanOrEqual(titanAlpha.radius + 3.5);
  });

  it('blocks weapon raycast when an asteroid is in the line of fire', () => {
    const titanAlpha = ARENA_OBSTACLES.find(o => o.id === 'obs_titan_alpha')!;
    // Attacker on one side, target directly on the other side
    const startX = titanAlpha.position[0] - 40;
    const startY = titanAlpha.position[1];
    const startZ = titanAlpha.position[2];

    const endX = titanAlpha.position[0] + 40;
    const endY = titanAlpha.position[1];
    const endZ = titanAlpha.position[2];

    const rayRes = checkObstacleRaycast(startX, startY, startZ, endX, endY, endZ);
    expect(rayRes.blocked).toBe(true);
    expect(rayRes.obstacle?.id).toBe(titanAlpha.id);
    expect(rayRes.hitPoint).not.toBeNull();
  });

  it('blocks weapon raycast when shooting directly downward into planetary terrain', () => {
    const startX = 0;
    const startY = 0; // In dogfighting airspace
    const startZ = 0;

    const endX = 0;
    const endY = -150; // Below terrain level
    const endZ = 0;

    const rayRes = checkObstacleRaycast(startX, startY, startZ, endX, endY, endZ);
    expect(rayRes.blocked).toBe(true);
    expect(rayRes.hitPoint).not.toBeNull();
    // Hit point Y should match terrain surface
    expect(rayRes.hitPoint![1]).toBeCloseTo(getTerrainHeight(0, 0), 1);
  });
});
