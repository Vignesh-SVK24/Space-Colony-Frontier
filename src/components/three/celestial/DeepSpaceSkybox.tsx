import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getNebulaCloudTexture } from '../../../utils/pbrTextureGenerator';

/**
 * Cinematic Deep Space Skybox
 * Multi-tier 3D space environment with spectral stars, dense galactic clusters,
 * organic volumetric nebula formations, and distant spiral galaxy disc.
 * Absolutely zero flat boxes, zero grid lines, zero square edges.
 */
export const DeepSpaceSkybox: FC = () => {
  const nearStarsRef = useRef<THREE.Points>(null);
  const nebulaeGroupRef = useRef<THREE.Group>(null);

  // Textures for soft organic cloud puffs (Gaussian alpha falloff)
  const violetNebulaTex = useMemo(() => getNebulaCloudTexture('violet'), []);
  const cyanNebulaTex = useMemo(() => getNebulaCloudTexture('cyan'), []);
  const amberNebulaTex = useMemo(() => getNebulaCloudTexture('amber'), []);
  const galaxyTex = useMemo(() => getNebulaCloudTexture('galaxy'), []);

  // Layer 1: Spectral Multi-Color Near Stars (O/B/A/G/K/M classes)
  const [nearPositions, nearColors, nearSizes] = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const spectralPalette = [
      new THREE.Color('#38bdf8'), // O/B Class Electric Blue
      new THREE.Color('#93c5fd'), // B Class Sapphire Blue
      new THREE.Color('#ffffff'), // A Class Pure White
      new THREE.Color('#fef08a'), // G Class Solar Yellow
      new THREE.Color('#fb923c'), // K Class Orange
      new THREE.Color('#f87171')  // M Class Deep Red
    ];

    for (let i = 0; i < count; i++) {
      const radius = 320 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = spectralPalette[Math.floor(Math.random() * spectralPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1.2 + Math.random() * 2.2;
    }
    return [positions, colors, sizes];
  }, []);

  // Layer 2: Ultra-Dense Distant Faint Stars (Tiny background cosmic continuum)
  const distantPositions = useMemo(() => {
    const count = 6500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 620 + Math.random() * 280;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Layer 3: Galactic Star Clusters (Deep space stellar groupings)
  const clusterPositions = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const clusterCenters = [
      new THREE.Vector3(-380, 220, -500),
      new THREE.Vector3(420, -180, -480),
      new THREE.Vector3(-200, -320, 450)
    ];

    for (let i = 0; i < count; i++) {
      const center = clusterCenters[i % clusterCenters.length];
      const spread = 75;
      const ox = (Math.random() - 0.5) * spread;
      const oy = (Math.random() - 0.5) * spread;
      const oz = (Math.random() - 0.5) * spread;

      positions[i * 3] = center.x + ox;
      positions[i * 3 + 1] = center.y + oy;
      positions[i * 3 + 2] = center.z + oz;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    // Subtle organic drift of the stellar nebulae
    if (nebulaeGroupRef.current) {
      nebulaeGroupRef.current.rotation.y += delta * 0.001;
    }
    // Gentle twinkling on near stars
    if (nearStarsRef.current) {
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12;
      (nearStarsRef.current.material as THREE.PointsMaterial).opacity = pulse;
    }
  });

  return (
    <group>
      {/* 1. Spectral Multi-Tier Stars with Color Classification */}
      <points ref={nearStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nearColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.8}
          vertexColors
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 2. Deep Cosmic Star Blanket */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[distantPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          color="#cbd5e1"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>

      {/* 3. Dense Stellar Clusters */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[clusterPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.4}
          color="#93c5fd"
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 4. Layered Volumetric Organic Nebulae */}
      <group ref={nebulaeGroupRef}>
        {/* Nebula Formation Alpha: The Orion-Viper Rift (Violet, Magenta & Indigo) */}
        <group position={[-280, 140, -420]}>
          <mesh position={[0, 0, 0]} rotation={[0.2, 0.4, 0]}>
            <planeGeometry args={[320, 240]} />
            <meshBasicMaterial
              map={violetNebulaTex}
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[40, -25, 30]} rotation={[-0.3, 0.2, 0.4]}>
            <planeGeometry args={[260, 200]} />
            <meshBasicMaterial
              map={violetNebulaTex}
              color="#e879f9"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[-35, 30, -20]} rotation={[0.4, -0.2, -0.3]}>
            <planeGeometry args={[220, 180]} />
            <meshBasicMaterial
              map={violetNebulaTex}
              color="#38bdf8"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Nebula Formation Beta: The Cygnus Veil (Cyan, Navy & Teal) */}
        <group position={[340, -90, -460]}>
          <mesh position={[0, 0, 0]} rotation={[-0.3, -0.5, 0.1]}>
            <planeGeometry args={[360, 260]} />
            <meshBasicMaterial
              map={cyanNebulaTex}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[-30, 20, 25]} rotation={[0.2, -0.3, 0.3]}>
            <planeGeometry args={[280, 200]} />
            <meshBasicMaterial
              map={cyanNebulaTex}
              color="#38bdf8"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Nebula Formation Gamma: The Golden Solar Veil (Warm Amber & Gold Dust) */}
        <group position={[180, 220, 160]}>
          <mesh position={[0, 0, 0]} rotation={[0.4, 0.8, -0.2]}>
            <planeGeometry args={[300, 220]} />
            <meshBasicMaterial
              map={amberNebulaTex}
              transparent
              opacity={0.42}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[25, -20, 20]} rotation={[-0.2, 0.5, 0.1]}>
            <planeGeometry args={[240, 170]} />
            <meshBasicMaterial
              map={amberNebulaTex}
              color="#f59e0b"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Distant Barred Spiral Galaxy Disc */}
        <group position={[-360, -200, -520]} rotation={[0.8, -0.6, 0.5]}>
          <mesh>
            <planeGeometry args={[220, 140]} />
            <meshBasicMaterial
              map={galaxyTex}
              transparent
              opacity={0.58}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};
