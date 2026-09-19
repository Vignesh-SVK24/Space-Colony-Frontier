const fs = require('fs');
const content = `import { useRef, type FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

function QuantumCoreBeacon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.x += delta * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.6;
    }
  });

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

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredEntity({
      name: 'QUANTUM CORE BEACON',
      type: 'COLONY INFRASTRUCTURE',
      distanceM: 45,
      actionPrompt: 'CLICK TO INSPECT BEACON'
    });
  };

  const handlePointerOut = () => {
    setHoveredEntity(null);
  };

  return (
    <group
      position={[0, 1.5, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.2}
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

function LandingPad() {
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectEntity({
      id: 'pad-01',
      name: 'PRIMARY LANDING PAD',
      type: 'building',
      status: 'CLEAR FOR DESCENT',
      distanceKm: 0.2,
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
    <mesh
      position={[0, -1.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredEntity({
          name: 'PRIMARY LANDING PAD',
          type: 'FLIGHT DECK',
          distanceM: 70,
          actionPrompt: 'CLICK TO INSPECT PAD'
        });
      }}
      onPointerOut={() => setHoveredEntity(null)}
    >
      <cylinderGeometry args={[4.5, 4.8, 0.25, 8]} />
      <meshStandardMaterial
        color="#1e293b"
        roughness={0.6}
        metalness={0.5}
      />
    </mesh>
  );
}

function TitaniumAsteroid() {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  useFrame((_, delta) => {
    if (asteroidRef.current) {
      asteroidRef.current.rotation.y += delta * 0.2;
      asteroidRef.current.rotation.x += delta * 0.1;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectEntity({
      id: 'ast-047',
      name: 'TITANIUM ASTEROID-047',
      type: 'asteroid',
      status: 'MINABLE',
      distanceKm: 2.4,
      metrics: [
        { label: 'TYPE', value: 'TITANIUM-RICH' },
        { label: 'EST. YIELD', value: '840', unit: 'MT' },
        { label: 'PURITY', value: '94.2', unit: '%' },
        { label: 'DENSITY', value: 'HIGH' }
      ],
      actions: [
        { id: 'scan', label: 'DEEP SPECTRAL SCAN', variant: 'primary' },
        { id: 'mine', label: 'DISPATCH MINING DRONES', variant: 'secondary' }
      ]
    });
  };

  return (
    <group position={[8, 3, -6]}>
      <mesh
        ref={asteroidRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'TITANIUM ASTEROID-047',
            type: 'RESOURCE ASTEROID',
            distanceM: 420,
            actionPrompt: 'PRESS [E] OR CLICK TO SCAN'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <dodecahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.8}
          metalness={0.7}
          emissive="#64748b"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Target Marker Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.25, 32]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export const SceneRoot: FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 4, 11], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color('#030712'));
          scene.fog = new THREE.FogExp2('#030712', 0.015);
        }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[12, 22, 16]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 2, 0]} intensity={2.5} color="#38bdf8" distance={15} />

        <Stars
          radius={140}
          depth={60}
          count={6000}
          factor={4}
          saturation={0.5}
          fade
          speed={0.8}
        />

        <gridHelper args={[40, 40, '#0284c7', '#0f172a']} position={[0, -0.1, 0]} />

        <QuantumCoreBeacon />
        <LandingPad />
        <TitaniumAsteroid />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
};
`;
fs.writeFileSync('src/components/three/scene/SceneRoot.tsx', content.trim() + '\n', 'utf8');
console.log('SceneRoot updated with interactive 3D objects and hover events.');
