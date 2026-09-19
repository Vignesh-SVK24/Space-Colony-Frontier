import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VISUAL_THEME } from '../../../config/visualTheme';

export const ProceduralPlanet: FC = () => {
  const planetRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.015;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.022;
    }
  });

  return (
    <group position={[0, -180, 0]} ref={planetRef}>
      {/* Planetary Core Sphere (Diameter ~320 units) */}
      <mesh receiveShadow>
        <sphereGeometry args={[160, 64, 64]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Desert Equatorial Belt */}
      <mesh rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[160.2, 48, 48, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.3]} />
        <meshStandardMaterial
          color={VISUAL_THEME.planet.biomes.desert.baseColor}
          roughness={VISUAL_THEME.planet.biomes.desert.roughness}
          metalness={VISUAL_THEME.planet.biomes.desert.metalness}
        />
      </mesh>

      {/* Glacial Polar Ice Caps */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[160.3, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.2]} />
        <meshStandardMaterial
          color={VISUAL_THEME.planet.biomes.frozen.baseColor}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[160.3, 32, 32, 0, Math.PI * 2, Math.PI * 0.8, Math.PI * 0.2]} />
        <meshStandardMaterial
          color={VISUAL_THEME.planet.biomes.frozen.baseColor}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Volcanic Magma Rift Emissive Band */}
      <mesh rotation={[0.4, 0.8, 0]}>
        <sphereGeometry args={[160.15, 32, 32, Math.PI * 0.2, Math.PI * 0.25, Math.PI * 0.4, Math.PI * 0.15]} />
        <meshStandardMaterial
          color="#1c1917"
          emissive={VISUAL_THEME.planet.biomes.volcanic.emissiveColor}
          emissiveIntensity={0.9}
          roughness={0.8}
        />
      </mesh>

      {/* Thin Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[161.4, 48, 48]} />
        <meshStandardMaterial
          color={VISUAL_THEME.planet.cloudColor}
          transparent
          opacity={0.3}
          roughness={1.0}
        />
      </mesh>

      {/* Atmosphere Rim Glow Halo */}
      <mesh>
        <sphereGeometry args={[164, 48, 48]} />
        <meshBasicMaterial
          color={VISUAL_THEME.planet.atmosphereGlow}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
