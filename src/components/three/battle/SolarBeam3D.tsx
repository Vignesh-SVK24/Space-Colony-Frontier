import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const SolarBeam3D: React.FC = () => {
  const activeSolarBeam = useMultiplayerStore(state => state.activeSolarBeam);
  const setActiveSolarBeam = useMultiplayerStore(state => state.setActiveSolarBeam);

  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const impactLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!activeSolarBeam) return;

    const elapsed = Date.now() - activeSolarBeam.timestamp;
    // Controlled 850ms beam lifetime with clean termination
    if (elapsed > 850) {
      setActiveSolarBeam(null);
      return;
    }

    if (!meshRef.current || !coreRef.current || !coronaRef.current) return;

    const start = new THREE.Vector3(...activeSolarBeam.start);
    const end = new THREE.Vector3(...activeSolarBeam.end);
    const distance = start.distanceTo(end);

    if (distance <= 0.1) return;

    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const rotQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.clone().sub(start).normalize()
    );

    // Smooth volumetric fadeout in final 250ms
    const fade = Math.max(0, Math.min(1.0, (850 - elapsed) / 250));

    // Outer warm amber sleeve
    meshRef.current.position.copy(midPoint);
    meshRef.current.scale.set(0.48, distance, 0.48);
    meshRef.current.quaternion.copy(rotQuat);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.38 * fade;

    // Focused warm gold core
    coreRef.current.position.copy(midPoint);
    coreRef.current.scale.set(0.22, distance, 0.22);
    coreRef.current.quaternion.copy(rotQuat);
    (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * fade;

    // Subtle outer corona halo
    coronaRef.current.position.copy(midPoint);
    coronaRef.current.scale.set(0.72, distance, 0.72);
    coronaRef.current.quaternion.copy(rotQuat);
    (coronaRef.current.material as THREE.MeshBasicMaterial).opacity = 0.14 * fade;

    if (impactLightRef.current) {
      impactLightRef.current.intensity = 1.8 * fade;
    }
  });

  if (!activeSolarBeam) return null;

  return (
    <group>
      {/* Warm Amber Outer Glow Cylinder */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Controlled High-Energy Gold Core */}
      <mesh ref={coreRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Faint Volumetric Corona */}
      <mesh ref={coronaRef}>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshBasicMaterial
          color="#d97706"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle localized target illumination (max 8m radius, no global blinding light) */}
      <pointLight
        ref={impactLightRef}
        position={activeSolarBeam.end}
        color="#ffb000"
        intensity={1.8}
        distance={10}
      />
    </group>
  );
};
