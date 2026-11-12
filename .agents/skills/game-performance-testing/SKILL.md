---
name: game-performance-testing
description: Benchmarking, developer performance telemetry, and 1-to-4-player simulation load testing for Space Colony: Frontier.
---

# Game Performance Testing

## Purpose
Measure client frame times, WebGL render stats, and server simulation tick budgets before and after optimizations.

## Activation Conditions
- Verifying performance targets (60 FPS desktop, 45-60 FPS mobile, < 5ms server tick).

## Workflow
1. **Client Telemetry**: Inspect `gl.info.render` (draw calls, triangles), `gl.info.memory` (geometries, textures), FPS, and frame time (ms) in the developer performance panel.
2. **Server Simulation Benchmark**: Measure 30Hz `SimulationLoop.update()` duration under 4-player continuous movement + projectile firing.
3. **Regression Check**: Run `npm run build`, server `tsc --noEmit`, and all Vitest suites.

## Verification Checklist
- [ ] Before/after metrics recorded without guessing.
- [ ] Developer diagnostics remain gated behind debug toggle (`F4` / dev panel) and hidden from normal players.
