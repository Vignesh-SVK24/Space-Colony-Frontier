---
name: mobile-game-optimization
description: Adaptive quality profiles, DPR scaling, thermal/battery protection, and touch responsiveness for iOS Safari and Android Chrome.
---

# Mobile Game Optimization

## Purpose
Provide smooth, cool-running gameplay on iPhone/iPad Safari and Android Chrome via adaptive quality profiles and safe-area-aware touch controls.

## Activation Conditions
- Editing `mobileOptimization.ts`, `graphicsConfig.ts`, `BattleScene.tsx`, or `VirtualJoystick.tsx`.

## Workflow
1. **Adaptive Profiles**: Automatically select `HIGH`, `MEDIUM`, or `LOW` presets based on device hardware concurrency, memory, and screen size.
2. **Thermal & Tab Suspension**: Pause/throttle heavy non-essential updates on `document.visibilitychange` (`hidden`).
3. **Touch Ergonomics**: Keep joystick DOM transforms GPU-accelerated (`translate3d`) with zero React re-renders during drag.

## Constraints
- Never force desktop ultra shadows or bloom onto mobile GPUs.
- Respect `env(safe-area-inset-*)` on notched devices.

## Verification Checklist
- [ ] Mobile DPR capped appropriately.
- [ ] VirtualJoystick produces 0 React state re-renders per touchmove frame.
