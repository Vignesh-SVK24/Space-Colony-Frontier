import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const AlienUFOActivity: FC = () => {
  const ufoGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { selectEntity, setHoveredEntity, recordDiscovery } = useNexusGameStore();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (ufoGroupRef.current) {
      // Wide undulating orbital patrol across outer sectors
      const angle = t * 0.05 + 1.8;
      const r = 160 + Math.sin(t * 0.3) * 35;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = 60 + Math.cos(t * 0.4) * 25;

      ufoGroupRef.current.position.set(x, y, z);
      ufoGroupRef.current.rotation.y += delta * 0.5;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 1.5;
    }
  });

  return (
    <group
      ref={ufoGroupRef}
      onClick={(e) => {
        e.stopPropagation();
        recordDiscovery('ufo-valkyrie', 'ANOMALOUS NON-TERRESTRIAL VESSEL');
        selectEntity({
          id: 'ufo-valkyrie',
          name: 'ANOMALOUS CONTACT UFO-X17',
          type: 'ufo',
          status: 'UNIDENTIFIED QUANTUM WARP SIGNATURE',
          distanceKm: 180,
          metrics: [
            { label: 'ORIGIN', value: 'EXTRAGALACTIC' },
            { label: 'PROPULSION', value: 'GRAVITATIONAL DISTORTION' },
            { label: 'SHIELD HARMONICS', value: 'PHASE-SHIFTED' },
            { label: 'THREAT ASSESSMENT', value: 'PROBING / OBSERVANT' }
          ],
          actions: [
            { id: 'alien_ping', label: 'TRANSMIT HARMONIC GREETING', variant: 'primary' },
            { id: 'quantum_scan', label: 'QUANTUM SPECTRAL DECODER', variant: 'secondary' }
          ]
        });
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredEntity({
          name: 'ANOMALOUS CONTACT UFO-X17',
          type: 'NON-TERRESTRIAL CRAFT',
          distanceM: 1800,
          actionPrompt: 'CLICK TO SCAN ALIEN ENERGY WARP'
        });
      }}
      onPointerOut={() => setHoveredEntity(null)}
    >
      {/* Central Exotic Saucer Core with reflective metamaterial alloy */}
      <mesh>
        <cylinderGeometry args={[2.8, 0.4, 1.2, 32]} />
        <meshPhysicalMaterial
          color="#0f172a"
          emissive="#7c3aed"
          emissiveIntensity={0.65}
          metalness={0.98}
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          reflectivity={1.0}
        />
      </mesh>

      {/* Bioluminescent Phase Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.8, 0.15, 16, 48]} />
        <meshStandardMaterial
          color="#2dd4bf"
          emissive="#2dd4bf"
          emissiveIntensity={2.2}
          wireframe
        />
      </mesh>

      {/* Volumetric Scanning Tractor Beam */}
      <mesh position={[0, -3.2, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2.2, 5.5, 24, 1, true]} />
        <meshBasicMaterial
          color="#2dd4bf"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Alien Emission Light Halo */}
      <pointLight color="#a855f7" intensity={3.0} distance={30} />
      <pointLight color="#2dd4bf" intensity={2.2} distance={20} />
    </group>
  );
};
