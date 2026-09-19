import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const OrbitalStations: FC = () => {
  const apexRingRef = useRef<THREE.Mesh>(null);
  const depotGantryRef = useRef<THREE.Group>(null);

  const { selectEntity, setHoveredEntity, recordDiscovery } = useNexusGameStore();

  useFrame((_, delta) => {
    if (apexRingRef.current) {
      apexRingRef.current.rotation.z += delta * 0.1; // Counter-rotating gravity wheel
    }
    if (depotGantryRef.current) {
      depotGantryRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      {/* 1. APEX ORBITAL STATION (Flagship Research Hub) at [80, 50, -40] */}
      <group
        position={[80, 50, -40]}
        onClick={(e) => {
          e.stopPropagation();
          recordDiscovery('apex-station', 'APEX ORBITAL STATION');
          selectEntity({
            id: 'apex-station',
            name: 'APEX ORBITAL STATION',
            type: 'spacecraft',
            status: 'OPERATIONAL / COMMERCE DOCKED',
            distanceKm: 104,
            metrics: [
              { label: 'POPULATION', value: '420', unit: 'CREW' },
              { label: 'GRAVITY TORUS', value: '0.88', unit: 'G' },
              { label: 'DOCKING BAYS', value: '4/6 OCCUPIED' },
              { label: 'DEFENSE MATRIX', value: 'ONLINE' }
            ],
            actions: [
              { id: 'request_docking', label: 'REQUEST DOCKING CLEARANCE', variant: 'primary' },
              { id: 'trade_cargo', label: 'OPEN COMMERCE FREIGHT EXCHANGE', variant: 'secondary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'APEX ORBITAL STATION',
            type: 'MAJOR RESEARCH HUB',
            distanceM: 1040,
            actionPrompt: 'PRESS [E] TO HAIL STATION / REQUEST DOCKING'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        {/* Central Core Spindle */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[2.5, 2.5, 18, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Rotating Centrifuge Habitat Torus */}
        <mesh ref={apexRingRef} position={[0, 0, 0]}>
          <torusGeometry args={[8.5, 0.9, 16, 48]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.8}
            roughness={0.2}
            emissive="#0284c7"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Habitat Spoke Struts */}
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 17, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 17, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>

        {/* Docking Bay Cylinder Pier at Base */}
        <mesh position={[0, -10, 0]}>
          <cylinderGeometry args={[4.2, 3.8, 3.5, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Docking Guidance Runways */}
        <mesh position={[0, -11.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.8, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Station Navigation Lights */}
        <pointLight position={[0, 10, 0]} color="#38bdf8" intensity={2.5} distance={35} />
        <pointLight position={[0, -10, 0]} color="#22c55e" intensity={2.0} distance={30} />
      </group>

      {/* 2. MINING DEPOT BETA at [-90, 35, 75] */}
      <group
        ref={depotGantryRef}
        position={[-90, 35, 75]}
        onClick={(e) => {
          e.stopPropagation();
          recordDiscovery('mining-depot-beta', 'MINING DEPOT BETA');
          selectEntity({
            id: 'mining-depot-beta',
            name: 'MINING DEPOT BETA',
            type: 'building',
            status: 'ORE REFINERY ACTIVE',
            distanceKm: 125,
            metrics: [
              { label: 'THROUGHPUT', value: '850', unit: 'T/HR' },
              { label: 'SILO CAPACITY', value: '82', unit: '%' },
              { label: 'TITANIUM PURITY', value: '99.8', unit: '%' },
              { label: 'HAULERS LINKED', value: '3' }
            ],
            actions: [
              { id: 'offload_ore', label: 'OFFLOAD RAW MINERALS', variant: 'primary' },
              { id: 'depot_fuel', label: 'PURCHASE REACTION PROPULSION', variant: 'secondary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'MINING DEPOT BETA',
            type: 'INDUSTRIAL REFINERY',
            distanceM: 1250,
            actionPrompt: 'CLICK TO INSPECT ORE STORAGE'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        {/* Main Industrial Silo Cluster */}
        <mesh position={[-2, 0, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 9, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.7} />
        </mesh>
        <mesh position={[2, 0, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 9, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.7} />
        </mesh>

        {/* Hazard Gantry Frame */}
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[7.5, 0.8, 3]} />
          <meshStandardMaterial color="#d97706" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Amber Refinery Beacon Light */}
        <pointLight position={[0, 6, 0]} color="#f59e0b" intensity={2.5} distance={30} />
      </group>
    </group>
  );
};
