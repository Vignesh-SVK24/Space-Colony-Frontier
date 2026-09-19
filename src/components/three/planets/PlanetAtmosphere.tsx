import { type FC } from 'react';
import * as THREE from 'three';

export const PlanetAtmosphere: FC = () => {
  return (
    <group position={[0, -100, 0]}>
      {/* Primary Rayleigh Atmospheric Scattering Shell */}
      <mesh>
        <sphereGeometry args={[103.5, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.22}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Cyan Rim Halo */}
      <mesh>
        <sphereGeometry args={[106.0, 48, 48]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
