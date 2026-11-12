---
name: multiplayer-network-optimization
description: Colyseus state synchronization, delta updates, client prediction, remote interpolation, and tick-budget optimization.
---

# Multiplayer Network Optimization

## Purpose
Keep Colyseus 30Hz server simulation fast (< 3ms/tick) and eliminate client rubber-banding or redundant bandwidth.

## Activation Conditions
- Editing `BattleRoom.ts`, `SimulationLoop.ts`, `BattleState.ts`, `colyseusClient.ts`, or `RemotePlayerShip.tsx`.

## Workflow
1. **Dirty-Check State Writes**: Skip Colyseus schema property writes when values have not meaningfully changed.
2. **Remote Interpolation**: Use velocity-extrapolated dead reckoning + smooth lerp/slerp in `RemotePlayerShip.tsx`.
3. **No Visual-Only Traffic**: Never broadcast decorative particles or client-only camera data.
4. **Heartbeat & Reconnect**: Maintain lightweight ping/pong RTT telemetry and clean `allowReconnection` teardown.

## Constraints
- Server remains 100% authoritative for HP, ammo, cooldowns, hit detection, and boundary clamping.
- Do not replace Colyseus or change room codes/modes.

## Verification Checklist
- [ ] Unchanged schema fields are not mutated every tick.
- [ ] Ping/RTT heartbeat stays lightweight and rate-limited.
- [ ] 2-player and 4-player combat rules remain intact.
