---
name: space-game-performance
description: End-to-end performance profiling and optimization workflow for Space Colony: Frontier (Measure -> Diagnose -> Change -> Verify).
---

# Space Game Performance

## Purpose
Ensure Space Colony: Frontier sustains 60 FPS on desktop, 45-60 FPS on capable mobile, and stable ~30 FPS on low-end mobile without breaking server-authoritative combat or physics.

## Activation Conditions
- Frame drops, stuttering, or GC pauses during multi-player dogfights.
- High CPU/GPU load or mobile thermal throttling.
- Adding new 3D assets, weapons, VFX, or HUD overlays.

## Workflow
1. **Measure**: Capture baseline FPS, frame time (ms), WebGL draw calls, triangles, active geometries/textures, RTT, and server tick duration.
2. **Diagnose**: Identify top bottlenecks (per-frame allocations in `useFrame`, unthrottled Zustand/React updates, unpooled meshes, or redundant server state mutations).
3. **Change**: Apply the smallest effective optimization preserving 250 HP, weapon damages (2 / 12 / 30), cooldowns, and Colyseus authority.
4. **Verify**: Re-measure frame times, run unit/benchmark tests, and confirm `npm run build` and `tsc --noEmit` pass.

## Constraints
- Never sacrifice server authority for client smoothness.
- Never alter established combat balance or physics collision rules.

## Verification Checklist
- [ ] Zero per-frame `new THREE.Vector3` / `Matrix4` / `Color` allocations in `useFrame`.
- [ ] React/Zustand store writes throttled outside 60Hz render loops.
- [ ] `npm run build` and physics/combat/security tests pass.
