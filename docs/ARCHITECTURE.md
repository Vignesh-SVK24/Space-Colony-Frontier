# System Architecture: SPACE COLONY: FRONTIER

## 1. Architectural Layers

- **Simulation Core (`src/game/simulation/`)**: Pure TypeScript simulation engine running on a deterministic fixed-timestep accumulator (10 ticks/s at 1x speed). Zero dependency on React or Three.js.
- **State Store (`src/state/`)**: Zustand store divided into modular domain slices:
  - timeSlice, resourceSlice, buildingSlice, colonistSlice, robotSlice, researchSlice, missionSlice, eventSlice, explorationSlice, ufoSlice, shipSlice, uiSlice, settingsSlice, saveSlice.
- **3D Render Engine (`src/components/three/`)**: React Three Fiber scene components that read state and synchronize high-frequency visual elements (rotations, particles, orbits) via mutable refs.
- **HUD & UI (`src/components/ui/`)**: Futuristic sci-fi telemetry interface styled with Tailwind CSS, supporting full keyboard navigation and touch controls.
- **Asset Fallback Registry (`src/assets/`)**: Resilient pipeline ensuring every 3D model has an immediate procedural mesh fallback if external GLB assets are missing or fail to load.

## 2. Tick Execution Sequence
1. Time progression & Day/Night sun rotation
2. Power grid balance calculation & Brownout factor determination
3. Production cycle execution (Solar -> Water -> O2 -> Food -> Mining)
4. Consumption cycle execution (Life support & Industrial feedstocks)
5. Survival metrics evaluation (Hypoxia, starvation, morale penalties)
6. Colonist state machine & scheduled routines
7. Robotic automation task queues
8. Dynamic planetary event checks
9. Mission objective evaluation
10. Research point absorption
11. UFO encounter state progression
12. Autosave interval verification
