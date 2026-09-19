import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EngineExhaustProps {
  throttle: number; // 0 to 1
  isBoosting: boolean;
  color?: string;
  flareColor?: string;
}

export const EngineExhaust: FC<EngineExhaustProps> = ({
  throttle,
  isBoosting,
  color = '#38bdf8',
  flareColor = '#67e8f9'
}) => {
  const leftGlowRef = useRef<THREE.Mesh>(null);
  const rightGlowRef = useRef<THREE.Mesh>(null);
  const leftCoreRef = useRef<THREE.Mesh>(null);
  const rightCoreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const targetScaleZ = isBoosting ? 2.8 : 0.6 + throttle * 1.2;
    const targetScaleXY = isBoosting ? 1.4 : 0.7 + throttle * 0.4;
    const flicker = 1 + (Math.random() - 0.5) * 0.15;

    [leftGlowRef, rightGlowRef].forEach((ref) => {
      if (ref.current) {
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, targetScaleZ * flicker, delta * 15);
        ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, targetScaleXY, delta * 15);
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetScaleXY, delta * 15);
      }
    });

    [leftCoreRef, rightCoreRef].forEach((ref) => {
      if (ref.current) {
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, targetScaleZ * 0.7 * flicker, delta * 20);
      }
    });
  });

  return (
    <group position={[0, 0, -1.8]}>
      {/* Left Engine Nozzle Exhaust */}
      <group position={[-0.6, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Outer Plasma Cone */}
        <mesh ref={leftGlowRef}>
          <coneGeometry args={[0.22, 1.4, 16, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isBoosting ? 0.9 : 0.6 * Math.max(0.2, throttle)}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner Hot Core */}
        <mesh ref={leftCoreRef}>
          <coneGeometry args={[0.12, 1.0, 16]} />
          <meshBasicMaterial
            color={flareColor}
            transparent
            opacity={isBoosting ? 1.0 : 0.8 * Math.max(0.3, throttle)}
          />
        </mesh>
      </group>

      {/* Right Engine Nozzle Exhaust */}
      <group position={[0.6, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Outer Plasma Cone */}
        <mesh ref={rightGlowRef}>
          <coneGeometry args={[0.22, 1.4, 16, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isBoosting ? 0.9 : 0.6 * Math.max(0.2, throttle)}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner Hot Core */}
        <mesh ref={rightCoreRef}>
          <coneGeometry args={[0.12, 1.0, 16]} />
          <meshBasicMaterial
            color={flareColor}
            transparent
            opacity={isBoosting ? 1.0 : 0.8 * Math.max(0.3, throttle)}
          />
        </mesh>
      </group>
    </group>
  );
};
