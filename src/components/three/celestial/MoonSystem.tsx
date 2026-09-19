import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const MoonSystem: FC = () => {
  const moonGroupRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);

  const { selectEntity, setHoveredEntity, moonAngle, recordDiscovery } = useNexusGameStore();

  // Orbital radius around main planet
  const orbitRadius = 185;
  const moonX = Math.cos(moonAngle) * orbitRadius;
  const moonZ = Math.sin(moonAngle) * orbitRadius;
  const moonY = Math.sin(moonAngle * 1.5) * 25; // Subtle orbital inclination

  useFrame((_, delta) => {
    if (moonMeshRef.current) {
      moonMeshRef.current.rotation.y += delta * 0.03;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    recordDiscovery('selene-prime', 'SELENE-PRIME (NATURAL SATELLITE)');
    selectEntity({
      id: 'selene-prime',
      name: 'SELENE-PRIME (MOON)',
      type: 'asteroid',
      status: 'SYNCHRONOUS ORBIT LOCKED',
      distanceKm: Math.round(orbitRadius * 10),
      metrics: [
        { label: 'ORBITAL RADIUS', value: '185', unit: 'KM' },
        { label: 'MASS', value: '7.34e22', unit: 'KG' },
        { label: 'REGOLITH', value: 'SILICATE / TITANIUM' },
        { label: 'BASE POTENTIAL', value: 'OPTIMAL (SITE B)' }
      ],
      actions: [
        { id: 'orbit_moon', label: 'PLOT ORBITAL INSERTION', variant: 'primary' },
        { id: 'scan_crater', label: 'RADAR TOPOGRAPHY SCAN', variant: 'secondary' }
      ]
    });
  };

  return (
    <group ref={moonGroupRef} position={[moonX, moonY, moonZ]}>
      {/* Cratered Selenic Moon Mesh with True Directional Sun Shadowing */}
      <mesh
        ref={moonMeshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'SELENE-PRIME (MOON)',
            type: 'NATURAL SATELLITE',
            distanceM: Math.round(orbitRadius * 100),
            actionPrompt: 'PRESS [E] TO SCAN / PLOT TRAJECTORY'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <sphereGeometry args={[14, 32, 32]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Subtle Moon Orbital Beacon Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[15.5, 15.8, 32]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
