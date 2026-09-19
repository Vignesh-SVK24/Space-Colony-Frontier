import { useMemo, type FC } from 'react';
import * as THREE from 'three';

export const DeepSpaceSkybox: FC = () => {
  // Layer 1: Spectral Multi-Color Near Stars (Brighter, subtle parallax)
  const [nearPositions, nearColors] = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const spectralPalette = [
      new THREE.Color('#38bdf8'), // O/B Class Blue
      new THREE.Color('#93c5fd'), // B Class Light Blue
      new THREE.Color('#ffffff'), // A Class White
      new THREE.Color('#fef08a'), // G Class Yellow
      new THREE.Color('#fb923c'), // K Class Orange
      new THREE.Color('#f87171')  // M Class Red
    ];

    for (let i = 0; i < count; i++) {
      const radius = 280 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = spectralPalette[Math.floor(Math.random() * spectralPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return [positions, colors];
  }, []);

  // Layer 2: Ultra-Dense Distant Faint Stars (Tiny background continuum)
  const distantPositions = useMemo(() => {
    const count = 4500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 550 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Spectral Multi-Tier Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nearPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[nearColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Deep Background Micro Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[distantPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          color="#cbd5e1"
          transparent
          opacity={0.65}
        />
      </points>

      {/* Procedural Distant Nebula Clouds (Violet & Magenta Cosmic Dust) */}
      <group position={[-250, 120, -380]}>
        <mesh rotation={[0.4, 0.2, 0]}>
          <planeGeometry args={[280, 200]} />
          <meshBasicMaterial
            color="#4c1d95"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[20, -10, 10]} rotation={[-0.2, 0.4, 0.2]}>
          <planeGeometry args={[220, 160]} />
          <meshBasicMaterial
            color="#701a75"
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Secondary Cyan / Deep Blue Nebula Veil */}
      <group position={[320, -80, -420]}>
        <mesh rotation={[-0.3, -0.5, 0.1]}>
          <planeGeometry args={[300, 220]} />
          <meshBasicMaterial
            color="#0369a1"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
};
