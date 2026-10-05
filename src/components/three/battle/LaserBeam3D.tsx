import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const LaserBeam3D: React.FC = () => {
  const activeLaserBeam = useMultiplayerStore(state => state.activeLaserBeam);
  const setActiveLaserBeam = useMultiplayerStore(state => state.setActiveLaserBeam);
  
  const coreMesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);
  const ionMesh = useRef<THREE.Mesh>(null);
  const sparkMesh = useRef<THREE.Points>(null);
  const impactLightRef = useRef<THREE.PointLight>(null);

  const sparkGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 16;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!activeLaserBeam) return;

    const elapsed = Date.now() - activeLaserBeam.timestamp;
    // Controlled 600ms beam lifetime (terminates completely)
    if (elapsed > 600) {
      setActiveLaserBeam(null);
      return;
    }

    const start = new THREE.Vector3(...activeLaserBeam.start);
    const end = new THREE.Vector3(...activeLaserBeam.end);
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();

    if (length <= 0.1) return;

    // Midpoint position and orientation
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const orientation = new THREE.Matrix4();
    orientation.lookAt(start, end, new THREE.Vector3(0, 1, 0));
    const rotation = new THREE.Euler().setFromRotationMatrix(orientation);

    // Smooth fadeout towards end of lifetime
    const fade = Math.max(0, 1.0 - (elapsed / 600));

    if (coreMesh.current) {
      coreMesh.current.position.copy(mid);
      coreMesh.current.rotation.copy(rotation);
      coreMesh.current.scale.set(1, 1, length);
      (coreMesh.current.material as THREE.MeshBasicMaterial).opacity = fade;
    }

    if (glowMesh.current) {
      glowMesh.current.position.copy(mid);
      glowMesh.current.rotation.copy(rotation);
      glowMesh.current.scale.set(1.5, 1.5, length);
      (glowMesh.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * fade;
    }

    if (ionMesh.current) {
      ionMesh.current.position.copy(mid);
      ionMesh.current.rotation.copy(rotation);
      ionMesh.current.scale.set(2.2, 2.2, length);
      (ionMesh.current.material as THREE.MeshBasicMaterial).opacity = 0.18 * fade;
    }

    if (sparkMesh.current) {
      sparkMesh.current.position.copy(end);
      sparkMesh.current.rotation.y += delta * 14;
    }

    if (impactLightRef.current) {
      impactLightRef.current.intensity = 1.2 * fade;
    }
  });

  if (!activeLaserBeam) return null;

  const beamColor = activeLaserBeam.color === 'red'
    ? '#f87171'
    : activeLaserBeam.color === 'blue'
    ? '#8ccdeb'
    : activeLaserBeam.color === 'green'
    ? '#4ade80'
    : '#fbbf24';

  return (
    <group>
      {/* Narrow bright needle core */}
      <mesh ref={coreMesh}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshBasicMaterial color="#ffffff" transparent />
      </mesh>

      {/* Controlled radiant energy sleeve */}
      <mesh ref={glowMesh}>
        <cylinderGeometry args={[0.14, 0.14, 1, 8]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Soft atmospheric ionization envelope */}
      <mesh ref={ionMesh}>
        <cylinderGeometry args={[0.24, 0.24, 1, 8]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Impact Sparks */}
      <points ref={sparkMesh} geometry={sparkGeometry}>
        <pointsMaterial color={beamColor} size={0.18} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </points>

      {/* Subtle localized impact light (non-blinding, decays cleanly) */}
      <pointLight 
        ref={impactLightRef}
        position={activeLaserBeam.end} 
        color={beamColor} 
        intensity={1.2} 
        distance={9} 
      />
    </group>
  );
};
