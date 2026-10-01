import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const SolarBeam3D: React.FC = () => {
  const activeSolarBeam = useMultiplayerStore(state => state.activeSolarBeam);
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!activeSolarBeam || !meshRef.current || !coreRef.current) return;

    const start = new THREE.Vector3(...activeSolarBeam.start);
    const end = new THREE.Vector3(...activeSolarBeam.end);
    const distance = start.distanceTo(end);

    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    meshRef.current.position.copy(midPoint);
    meshRef.current.scale.set(1.4, distance, 1.4);
    meshRef.current.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.clone().sub(start).normalize()
    );

    coreRef.current.position.copy(midPoint);
    coreRef.current.scale.set(0.6, distance, 0.6);
    coreRef.current.quaternion.copy(meshRef.current.quaternion);
  });

  if (!activeSolarBeam) return null;

  return (
    <group>
      {/* Outer Solar Flare Cylinder */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Intense White/Gold Core Beam */}
      <mesh ref={coreRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshBasicMaterial
          color="#fffbeb"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
