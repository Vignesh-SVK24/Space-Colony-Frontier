import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const BattleArena: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  const selfState = useMultiplayerStore(state => state.selfState);

  useFrame((state, delta) => {
    if (!materialRef.current || !selfState) return;

    const playerPos = new THREE.Vector3().fromArray(selfState.position);
    const dist = playerPos.length();
    
    // 300 radius arena. Warn at 250+.
    const margin = 50;
    const boundaryRadius = 300;
    
    let targetOpacity = 0.02;
    let targetColor = new THREE.Color('#06b6d4'); // cyan
    
    if (dist > boundaryRadius - margin) {
      const intensity = Math.min(1, (dist - (boundaryRadius - margin)) / margin);
      targetOpacity = THREE.MathUtils.lerp(0.02, 0.15, intensity);
      
      const pulse = (Math.sin(state.clock.elapsedTime * 10) + 1) / 2; // 0 to 1
      targetOpacity += pulse * 0.05 * intensity;
      
      targetColor.lerp(new THREE.Color('#ef4444'), intensity); // lerp to red
    }
    
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 5);
    materialRef.current.color.lerp(targetColor, delta * 5);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[300, 32, 32]} />
      <meshBasicMaterial 
        ref={materialRef}
        wireframe 
        transparent 
        opacity={0.02} 
        color="#06b6d4" 
        side={THREE.BackSide}
      />
    </mesh>
  );
};
