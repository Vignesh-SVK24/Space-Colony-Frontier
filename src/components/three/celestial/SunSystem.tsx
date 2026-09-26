import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const SunSystem: FC = () => {
  const coronaRef = useRef<THREE.Mesh>(null);
  const outerCoronaRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);

  const { weatherEvent, solarCycleAngle, graphicsSettings } = useNexusGameStore();
  const isSolarStorm = weatherEvent === 'SOLAR_STORM';

  const shadowRes = graphicsSettings.shadowQuality === 'ultra' ? 4096 :
                    graphicsSettings.shadowQuality === 'high' ? 2048 : 1024;
  const isCastingShadow = graphicsSettings.shadows && graphicsSettings.shadowQuality !== 'off';

  // Dynamic Sun Position based on celestial solarCycleAngle
  const sunDistance = 450;
  const sunX = Math.cos(solarCycleAngle) * sunDistance;
  const sunY = 180 + Math.sin(solarCycleAngle * 0.5) * 40;
  const sunZ = Math.sin(solarCycleAngle) * sunDistance;

  useFrame((state, delta) => {
    if (coronaRef.current) {
      coronaRef.current.rotation.z += delta * 0.05;
      coronaRef.current.rotation.y += delta * 0.02;
    }
    if (outerCoronaRef.current) {
      outerCoronaRef.current.rotation.z -= delta * 0.03;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
      outerCoronaRef.current.scale.setScalar(pulse);
    }
    if (flareRef.current) {
      flareRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group position={[sunX, sunY, sunZ]}>
      {/* Primary Directional Solar Light */}
      <directionalLight
        ref={lightRef}
        intensity={isSolarStorm ? 3.8 : 2.6}
        color={isSolarStorm ? '#ffd08a' : '#fff8ea'}
        castShadow={isCastingShadow}
        shadow-mapSize-width={shadowRes}
        shadow-mapSize-height={shadowRes}
        shadow-camera-near={10}
        shadow-camera-far={1000}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-bias={-0.00015}
      />

      {/* Central Solar Core */}
      <mesh>
        <sphereGeometry args={[26, 32, 32]} />
        <meshBasicMaterial color={isSolarStorm ? '#ffaa33' : '#fff4cc'} />
      </mesh>

      {/* Inner Corona Luminous Halo */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshBasicMaterial
          color={isSolarStorm ? '#ff6600' : '#ffb74d'}
          transparent
          opacity={0.7}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Layered Outer Atmospheric Corona */}
      <mesh ref={outerCoronaRef}>
        <sphereGeometry args={[38, 32, 32]} />
        <meshBasicMaterial
          color={isSolarStorm ? '#ea580c' : '#f59e0b'}
          transparent
          opacity={isSolarStorm ? 0.45 : 0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Solar Flare Particle Rays */}
      <points ref={flareRef}>
        <sphereGeometry args={[44, 24, 24]} />
        <pointsMaterial
          size={1.8}
          color={isSolarStorm ? '#f97316' : '#fef08a'}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Local Solar Omnidirectional Glow */}
      <pointLight
        color={isSolarStorm ? '#f97316' : '#fef08a'}
        intensity={isSolarStorm ? 6.0 : 4.0}
        distance={1200}
        decay={1.2}
      />
    </group>
  );
};
