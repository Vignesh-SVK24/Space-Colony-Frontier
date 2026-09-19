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
      {/* Central Exotic Saucer Core */}
      <mesh>
        <cylinderGeometry args={[2.8, 0.4, 1.2, 24]} />
        <meshStandardMaterial
          color="#1e1b4b"
          emissive="#7c3aed"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Bioluminescent Phase Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.8, 0.15, 16, 32]} />
        <meshStandardMaterial
          color="#2dd4bf"
          emissive="#2dd4bf"
          emissiveIntensity={2.5}
          wireframe
        />
      </mesh>

      {/* Alien Emission Light Halo */}
      <pointLight color="#a855f7" intensity={3.5} distance={30} />
      <pointLight color="#2dd4bf" intensity={2.0} distance={20} />
    </group>
  );
};
