---
name: threejs-render-optimization
description: Three.js and WebGL rendering optimization rules for instancing, draw-call reduction, material/geometry reuse, and post-processing control.
---

# Three.js Render Optimization

## Purpose
Minimize WebGL draw calls, shader switches, overdraw, and GPU memory footprint in React Three Fiber scenes.

## Activation Conditions
- Modifying `BattleScene.tsx`, `BattleArena.tsx`, `SpaceshipModel.tsx`, projectiles, beams, or celestial skyboxes.

## Workflow
1. **Instancing**: Use `THREE.InstancedMesh` for repeated asteroids, debris, projectiles, and stars.
2. **Resource Reuse**: Memoize or hoist shared `BufferGeometry`, `Material`, and `DataTexture` instances; never allocate inside `useFrame`.
3. **Shadows & Post-Processing**: Restrict shadow casting to primary directional sunlight (`SunSystem.tsx`) and disable `EffectComposer` bloom on mobile.
4. **Pixel Ratio**: Clamp DPR via `getOptimalDPR()` (`<= 1.5` mobile, `<= 2.0` desktop).

## Constraints
- Preserve the midnight-black/navy space palette, cyan/gold accents, and obstacle cover silhouettes.
- Do not reintroduce visible wireframe grids.

## Verification Checklist
- [ ] Draw calls remain bounded during 4-player combat.
- [ ] No geometries/materials recreated per frame.
- [ ] Frustum culling enabled on instanced/static groups where appropriate.
