---
name: memory-leak-detection
description: Prevent WebGL context, Three.js geometry/material/texture, interval, and event-listener memory leaks during extended matches.
---

# Memory Leak Detection

## Purpose
Ensure zero continuous memory growth across long matches, rematches, and room transitions.

## Activation Conditions
- Auditing `useEffect` hooks, `CanvasTexture` / `DataTexture` generators, `EffectComposer`, and Colyseus room listeners.

## Workflow
1. **Dispose WebGL Resources**: Call `.dispose()` on geometries, materials, textures, and `EffectComposer` on unmount.
2. **Cache Procedural Textures**: Reuse cached `DataTexture` / `CanvasTexture` instances instead of generating per component mount.
3. **Clean Listeners & Timers**: Pair every `addEventListener`, `setInterval`, and `requestAnimationFrame` with cleanup in `useEffect` return or `onDispose`.

## Verification Checklist
- [ ] Every dynamic `CanvasTexture` / `BufferGeometry` / `Material` is cached or disposed on unmount.
- [ ] `BattleRoom.onDispose` clears simulation intervals and IP/session maps.
