import { type FC } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipController } from '../spaceships/SpaceshipController';
import { ProceduralPlanet } from '../planets/ProceduralPlanet';
import { PlanetAtmosphere } from '../planets/PlanetAtmosphere';
import { SunSystem } from '../celestial/SunSystem';
import { DeepSpaceSkybox } from '../celestial/DeepSpaceSkybox';
import { DistantPlanets } from '../celestial/DistantPlanets';
import { MoonSystem } from '../celestial/MoonSystem';
import { SatelliteConstellation } from '../orbit/SatelliteConstellation';
import { OrbitalStations } from '../orbit/OrbitalStations';
import { ExpandedAsteroidBelts } from '../asteroids/ExpandedAsteroidBelts';
import { CivilianTrafficManager } from '../traffic/CivilianTrafficManager';
import { AlienUFOActivity } from '../aliens/AlienUFOActivity';
import { WorldSpaceLabels } from '../effects/WorldSpaceLabels';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

function ColonyLandingPad() {
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectEntity({
      id: 'pad-01',
      name: 'PRIMARY LANDING PAD',
      type: 'building',
      status: 'CLEAR FOR DESCENT',
      distanceKm: 0.1,
      metrics: [
        { label: 'BERTH', value: 'ALPHA-1' },
        { label: 'STATUS', value: 'ACTIVE' },
        { label: 'BEACON', value: 'LOCKED' },
        { label: 'REFUEL', value: 'READY' }
      ],
      actions: [
        { id: 'call_ship', label: 'SUMMON RECON CRAFT', variant: 'primary' },
        { id: 'pad_lights', label: 'TOGGLE RUNWAY LIGHTS', variant: 'secondary' }
      ]
    });
  };

  return (
    <group position={[0, -1.4, 0]}>
      {/* Octagonal Landing Tarmac */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'PRIMARY LANDING PAD',
            type: 'COLONY FLIGHT DECK',
            distanceM: 40,
            actionPrompt: 'PRESS [SPACE] TO HOVER / [E] TO LAND'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <cylinderGeometry args={[5.5, 5.8, 0.3, 8]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.6}
          metalness={0.5}
        />
      </mesh>

      {/* Runway Approach Light Strip */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 4.4, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

function QuantumCoreBeacon() {
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectEntity({
      id: 'beacon-01',
      name: 'QUANTUM CORE BEACON',
      type: 'building',
      status: 'OPERATIONAL',
      distanceKm: 0.1,
      metrics: [
        { label: 'OUTPUT', value: '1.21', unit: 'GW' },
        { label: 'STATUS', value: 'SYNCHRONIZED' },
        { label: 'INTEGRITY', value: '100', unit: '%' },
        { label: 'GRID LOAD', value: '42', unit: 'kW' }
      ],
      actions: [
        { id: 'boost', label: 'OVERCHARGE BEACON', variant: 'primary' },
        { id: 'diagnostics', label: 'RUN TELEMETRY', variant: 'secondary' }
      ]
    });
  };

  return (
    <group
      position={[0, 2.2, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredEntity({
          name: 'QUANTUM CORE BEACON',
          type: 'COLONY POWER CORE',
          distanceM: 50,
          actionPrompt: 'CLICK TO INSPECT BEACON'
        });
      }}
      onPointerOut={() => setHoveredEntity(null)}
    >
      <mesh castShadow>
        <octahedronGeometry args={[1.3, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.2}
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.4, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

export const SceneRoot: FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color('#02040a'));
          scene.fog = new THREE.FogExp2('#02040a', 0.004);
        }}
      >
        {/* Global Ambient & Deep Space Rim Fill */}
        <ambientLight intensity={0.2} />
        <hemisphereLight args={['#38bdf8', '#020617', 0.35]} />

        {/* Local Colony Beacon Point Light */}
        <pointLight position={[0, 3, 0]} intensity={3.0} color="#38bdf8" distance={30} />

        {/* TIER 8: Deep Space Sun / Primary Directional Star System */}
        <SunSystem />

        {/* TIER 8: 3-Tier Multi-Depth Spectral Starfield & Volumetric Nebulae */}
        <DeepSpaceSkybox />

        {/* TIER 8: Distant Planetary Bodies (Gorgon, Boreas, Pyros) */}
        <DistantPlanets />

        {/* TIER 3: Main Planetary Sphere & Biomes */}
        <ProceduralPlanet />

        {/* TIER 3: Atmospheric Scattering Shell & Rim Halo */}
        <PlanetAtmosphere />

        {/* TIER 5: Orbiting Selenic Moon with True Solar Shadow Phases */}
        <MoonSystem />

        {/* TIER 4: Synchronized Satellite Constellation */}
        <SatelliteConstellation />

        {/* TIER 7: Orbital Stations (Apex Research Hub & Mining Depot) */}
        <OrbitalStations />

        {/* TIER 6: 4 Instanced Asteroid Belts & Orbital Space Debris */}
        <ExpandedAsteroidBelts />

        {/* TIER 6: AI Civilian Space Traffic (Cargo, Mining, Recon) */}
        <CivilianTrafficManager />

        {/* TIER 8: Alien UFO Activity & Quantum Warp Patrols */}
        <AlienUFOActivity />

        {/* TIER 1: Colony Ground Base Modules */}
        <ColonyLandingPad />
        <QuantumCoreBeacon />

        {/* 3D World-Space Distance-Attenuated Landmark Labels */}
        <WorldSpaceLabels />

        {/* Player Controlled Spaceship with 6-DOF Flight Kinematics & Dual Camera */}
        <SpaceshipController initialPosition={[0, 8, 14]} />
      </Canvas>
    </div>
  );
};
