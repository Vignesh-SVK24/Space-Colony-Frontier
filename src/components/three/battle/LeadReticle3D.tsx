import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const LeadReticle3D: React.FC = () => {
  const leadIndicator = useMultiplayerStore(state => state.leadIndicator);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!leadIndicator || !leadIndicator.visible) return;
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  if (!leadIndicator || !leadIndicator.visible) return null;

  return (
    <group position={leadIndicator.worldPos}>
      {/* Central Pip */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </mesh>

      {/* Outer Rotating Predictive Lead Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[1.0, 1.25, 24]} />
        <meshBasicMaterial 
          color="#38bdf8" 
          side={THREE.DoubleSide} 
          transparent 
          opacity={0.6} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
    </group>
  );
};
