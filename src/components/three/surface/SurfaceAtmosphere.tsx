import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const SurfaceAtmosphere: FC = () => {
  const { gameMode } = useNexusGameStore();
  const dustRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const count = 250;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.8;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      vel[i * 3 + 2] = 0.5 + Math.random() * 0.8;
    }

    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!dustRef.current) return;
    const posAttr = dustRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 250; i++) {
      arr[i * 3 + 0] += velocities[i * 3 + 0] * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      if (arr[i * 3 + 2] > 60) arr[i * 3 + 2] = -60;
      if (arr[i * 3 + 1] > 9) arr[i * 3 + 1] = 0.5;
      if (arr[i * 3 + 1] < 0.2) arr[i * 3 + 1] = 8;
    }
    posAttr.needsUpdate = true;
  });

  const isGroundMode = gameMode === 'ASTRONAUT' || gameMode === 'LANDED' || gameMode === 'LANDING_TRANSITION';

  return (
    <group>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isGroundMode ? 0.35 : 0.15}
          color="#38bdf8"
          transparent
          opacity={isGroundMode ? 0.45 : 0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {isGroundMode && (
        <directionalLight
          position={[40, 25, -30]}
          intensity={1.8}
          color="#fef08a"
          castShadow
        />
      )}
    </group>
  );
};
