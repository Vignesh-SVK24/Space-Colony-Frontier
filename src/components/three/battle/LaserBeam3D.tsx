import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const LaserBeam3D: React.FC = () => {
  const activeLaserBeam = useMultiplayerStore(state => state.activeLaserBeam);
  const setActiveLaserBeam = useMultiplayerStore(state => state.setActiveLaserBeam);
  
  const coreMesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);
  const sparkMesh = useRef<THREE.Points>(null);

  const sparkGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 24;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!activeLaserBeam) return;

    // Check expiration (700ms beam sustain)
    if (Date.now() - activeLaserBeam.timestamp > 700) {
      setActiveLaserBeam(null);
      return;
    }

    const start = new THREE.Vector3(...activeLaserBeam.start);
    const end = new THREE.Vector3(...activeLaserBeam.end);
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();

    if (length <= 0.1) return;

    // Midpoint position
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Orientation
    const orientation = new THREE.Matrix4();
    orientation.lookAt(start, end, new THREE.Vector3(0, 1, 0));
    const rotation = new THREE.Euler().setFromRotationMatrix(orientation);

    if (coreMesh.current) {
      coreMesh.current.position.copy(mid);
      coreMesh.current.rotation.copy(rotation);
      coreMesh.current.scale.set(1, 1, length);
    }

    if (glowMesh.current) {
      glowMesh.current.position.copy(mid);
      glowMesh.current.rotation.copy(rotation);
      glowMesh.current.scale.set(1.8, 1.8, length);
    }

    if (sparkMesh.current) {
      sparkMesh.current.position.copy(end);
      sparkMesh.current.rotation.y += delta * 12;
    }
  });

  if (!activeLaserBeam) return null;

  const beamColor = activeLaserBeam.color === 'red' ? '#ef4444' : activeLaserBeam.color === 'blue' ? '#38bdf8' : activeLaserBeam.color === 'green' ? '#22c55e' : '#eab308';

  return (
    <group>
      {/* High-intensity core cylinder */}
      <mesh ref={coreMesh}>
        <cylinderGeometry args={[0.12, 0.12, 1, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Surrounding Energy Glow */}
      <mesh ref={glowMesh}>
        <cylinderGeometry args={[0.28, 0.28, 1, 8]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Impact Sparks */}
      <points ref={sparkMesh} geometry={sparkGeometry}>
        <pointsMaterial color={beamColor} size={0.3} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </points>

      {/* Impact point light */}
      <pointLight 
        position={activeLaserBeam.end} 
        color={beamColor} 
        intensity={activeLaserBeam.blocked ? 3.5 : 5.0} 
        distance={20} 
      />
    </group>
  );
};
