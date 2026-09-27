# SPACE COLONY: FRONTIER 🚀🌌

> **Real-Time Multiplayer & Solo AI 3D Space Combat Simulator**  
> Built with React 19, TypeScript, Three.js, React Three Fiber (R3F), Tailwind CSS, and Authoritative Socket.IO Backend.

---

## 🌟 Overview

**Space Colony: Frontier** is a high-octane 3D space flight and combat game featuring:
- **Authoritative Real-Time Multiplayer**: 60 Hz synchronized tick loop, swept continuous collision detection (anti-tunneling), and forgiving 4.5m combat hitboxes.
- **Solo AI Space Battles**: 13-state machine opponent (`EASY`, `NORMAL`, `HARD`) with dynamic cover-seeking behind asteroids.
- **Advanced Dual Weapons**:
  - **Plasma Blasters**: Rapid-fire continuous projectiles ($145\text{ m/s}$) with physical trajectory sweeps.
  - **3D Continuous Laser Beam**: High-energy instant beam ($20\text{ HP}$ damage) governed by a server-enforced **5.0-second recharge countdown** and line-of-sight raycasting through physical obstacles.
- **Dynamic 3D Lead Indicator**: Velocity-aware holographic reticle calculating first-order intercept vectors for high-speed dogfighting.
- **Full-Screen Tactical Vector Map**: Interactive SVG radar with depth range circles, obstacle classification, and layer controls (`M` key).
- **Planetary Landing & Astronaut Mode**: Orbital descent transitions and third-person ground rover/astronaut exploration.
- **Cross-Platform Responsive Controls**: Full keyboard/mouse flight controls for desktop and 360° virtual analog flight stick + dedicated weapon triggers on mobile/tablet.

---

## 🎮 Game Controls

### Desktop Controls
| Input | Action |
|---|---|
| **W / S** | Main Thrusters (Forward / Reverse) |
| **A / D** | Yaw Left / Right (Rudder) |
| **Q / E** | Roll Left / Right (Bank) |
| **Shift / Space** | Afterburner Boost / Airbrakes |
| **R / F** | Vertical Flight (Ascend / Descend) |
| **Mouse Drag** | Pitch & Yaw Flight Direction |
| **Left Click / J** | Fire Plasma Blaster |
| **Right Click / K** | Fire Continuous Laser Beam (5s Recharge) |
| **M** | Toggle Full-Screen Tactical Map |
| **ESC** | Close Modals / Exit Full-Screen Map |

### Mobile Controls
- **Left Virtual Analog Joystick**: 360° movement (forward/reverse thrust & steering)
- **Ascend / Descend Buttons**: Vertical altitude maneuvering
- **Right Touchpad**: Camera orientation & aiming
- **Combat Buttons**: Dedicated `FIRE`, `LASER`, `BOOST`, and `MAP` triggers

---

## 🏗️ Architecture

```
space-colony-frontier/
├── public/                 # 3D GLTF models, audio, textures, and cinematic background video
├── server/                 # Authoritative Multiplayer Game Server
│   ├── src/
│   │   ├── CombatSystem.ts     # Swept continuous collision & raycast line-of-sight
│   │   ├── CollisionSystem.ts  # Boundary containment & physical obstacle collision
│   │   ├── GameLoop.ts         # High-precision 60Hz physics tick loop
│   │   ├── RoomManager.ts      # 6-character room codes (e.g. A8X2K9) & rematch cycle
│   │   ├── arenaObstacles.ts   # Authoritative 3D obstacle registry (10 obstacles)
│   │   ├── types.ts            # Network protocols & combat types
│   │   └── index.ts            # Express + Socket.IO server entry
│   ├── package.json
│   └── tsconfig.json
├── src/                    # Frontend React Three Fiber Client
│   ├── components/
│   │   ├── three/          # 3D Scene, Spaceships, Battle Arena, Laser VFX, Lead HUD
│   │   └── ui/             # Nexus HUD, Tactical Map, Mode Selection, Match Results
│   ├── config/             # Shared combat constants, themes, and obstacle geometry
│   ├── multiplayer/        # Socket client, interpolation buffers, and Zustand store
│   └── state/              # Nexus game state management
└── tests/                  # Automated integration & unit tests (77 tests, 11 suites)
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vignesh-SVK24/Space-Colony-Frontier.git
   cd Space-Colony-Frontier
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install server dependencies**:
   ```bash
   cd server
   npm install
   npm run build
   cd ..
   ```

### Running Locally

1. **Start the authoritative multiplayer server** (Port `3001`):
   ```bash
   cd server
   node dist/index.js
   ```

2. **In a separate terminal, start the Vite frontend** (Port `5173`):
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

---

## 🧪 Running Tests

Run the full Vitest suite (including headless real-time 2-client Socket.IO integration tests):
```bash
npm test
```

Build production client bundle:
```bash
npm run build
```

---

## 🌐 Deployment

### Frontend (GitHub Pages / Vercel / Netlify)
To build static production assets:
```bash
npm run build
```
The output directory will be `dist/`.

### Backend (Render / Railway / Fly.io / AWS ECS)
Deploy the `server/` directory as a Node.js web service running `npm run build && node dist/index.js` on port `3001`. Set `VITE_SERVER_URL` in the frontend environment to point to your live backend domain.

---

## 📄 License
MIT License. Spaceship and planetary 3D models licensed under CC-BY / royalty-free frontier game asset terms.
