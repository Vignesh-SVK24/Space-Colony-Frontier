import { type FC } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SpaceshipController } from '../spaceships/SpaceshipController';
import { ProceduralPlanet } from '../planets/ProceduralPlanet';
import { AsteroidField } from '../asteroids/AsteroidField';
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
        {/* Cinematic Directional Sunlight with Strong Contrast */}
        <directionalLight
          position={[40, 70, 50]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Ambient & Fill Light */}
        <ambientLight intensity={0.25} />
        <hemisphereLight args={['#38bdf8', '#0f172a', 0.35]} />

        {/* Local Colony Point Light */}
        <pointLight position={[0, 3, 0]} intensity={3.0} color="#38bdf8" distance={25} />

        {/* Dense Twinkling Starfield */}
        <Stars
          radius={220}
          depth={80}
          count={8000}
          factor={4.5}
          saturation={0.6}
          fade
          speed={0.6}
        />

        {/* Procedural Planet Sphere with Biomes */}
        <ProceduralPlanet />

        {/* Instanced Asteroid Belt with Resource Visuals */}
        <AsteroidField />

        {/* Colony Base Modules */}
        <ColonyLandingPad />
        <QuantumCoreBeacon />

        {/* Player Controlled Spaceship with 3rd Person Chase / Cockpit Camera */}
        <SpaceshipController initialPosition={[0, 8, 14]} />
      </Canvas>
    </div>
  );
};
