import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { SpaceshipModel } from './SpaceshipModel';

export const LandedSpaceship: FC = () => {
  const { landedShipPosition, astronautPosition, boardShip } = useNexusGameStore();
  const beaconRef = useRef<THREE.PointLight>(null);

  const dToAstronaut = Math.hypot(
    astronautPosition[0] - landedShipPosition[0],
    astronautPosition[2] - landedShipPosition[2]
  );
  const isNear = dToAstronaut < 6.0;

  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.intensity = 1.0 + Math.sin(state.clock.elapsedTime * 4.0) * 0.5;
    }
  });

  return (
    <group position={landedShipPosition}>
      {/* Resting Spaceship Model */}
      <group position={[0, 1.2, 0]}>
        <SpaceshipModel
          throttle={0}
          isBoosting={false}
          paintScheme="default"
        />
      </group>

      {/* Boarding Gangway Ramp */}
      <mesh position={[0, 0.4, 2.8]} rotation={[0.4, 0, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.1, 2.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Runway Approach Beacon */}
      <pointLight ref={beaconRef} position={[0, 2.8, 0]} color="#38bdf8" intensity={1.5} distance={15} />

      {/* Boarding Proximity Ring */}
      <mesh
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (isNear) boardShip();
        }}
      >
        <ringGeometry args={[3.8, 4.2, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={isNear ? 0.9 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
