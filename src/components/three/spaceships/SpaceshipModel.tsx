import { useEffect, useState, useRef, useMemo, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VISUAL_THEME, SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { loadGLBAsset } from '../../../assets/AssetLoader';
import { EngineExhaust } from './EngineExhaust';
import { getBrushedMetalNormal, getRoughnessNoiseMap } from '../../../utils/pbrTextureGenerator';

import { isMobileDevice } from '../../../utils/mobileOptimization';

export interface SpaceshipModelProps {
  paintScheme?: SpaceshipPaintSchemeKey;
  throttle?: number; // 0 to 1
  isBoosting?: boolean;
  damaged?: boolean;
}

export const SpaceshipModel: FC<SpaceshipModelProps> = ({
  paintScheme = 'default',
  throttle = 0,
  isBoosting = false,
  damaged = false
}) => {
  const [externalModel, setExternalModel] = useState<THREE.Group | null>(null);
  const strobeRef = useRef<THREE.MeshBasicMaterial>(null);
  const theme = VISUAL_THEME.spaceshipPaintSchemes[paintScheme] || VISUAL_THEME.spaceshipPaintSchemes.default;
  const isMobile = useMemo(() => isMobileDevice(), []);

  const brushedNormal = useMemo(() => getBrushedMetalNormal(), []);
  const roughnessMap = useMemo(() => getRoughnessNoiseMap(), []);

  // Attempt async load of external GLB asset if present
  useEffect(() => {
    let active = true;
    loadGLBAsset('spaceship_explorer').then((loaded) => {
      if (active && loaded) {
        setExternalModel(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Strobe beacon blinking
  useFrame((state) => {
    if (strobeRef.current) {
      const flash = Math.sin(state.clock.elapsedTime * 6.0) > 0.6;
      strobeRef.current.color.setHex(flash ? 0xffffff : 0x334155);
    }
  });

  return (
    <group>
      {externalModel ? (
        <primitive object={externalModel} />
      ) : (
        /* Ultra-Realistic Procedural PBR Spaceship */
        <group>
          {/* Main Fuselage Body (Aerodynamic swept lifting body with brushed metal PBR) */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.9, 3.6, 6]} />
            <meshStandardMaterial
              color={damaged ? '#7f1d1d' : theme.primaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
              normalMap={brushedNormal}
              roughnessMap={roughnessMap}
              emissive={damaged ? '#b91c1c' : '#000000'}
              emissiveIntensity={damaged ? 0.35 : 0}
            />
          </mesh>

          {/* Secondary Upper Armor Dorsal Spine Plate */}
          <mesh position={[0, 0.28, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <boxGeometry args={[0.65, 2.2, 0.35]} />
            <meshStandardMaterial
              color={theme.secondaryHull}
              roughness={theme.roughness * 0.85}
              metalness={0.92}
              normalMap={brushedNormal}
            />
          </mesh>

          <mesh position={[0, 0.42, 0.6]} rotation={[Math.PI / 4, 0, 0]} castShadow={!isMobile}>
            <capsuleGeometry args={[0.3, 0.7, 10, isMobile ? 12 : 20]} />
            {isMobile ? (
              <meshStandardMaterial
                color={theme.cockpitGlass}
                roughness={0.1}
                metalness={0.4}
                transparent
                opacity={0.8}
              />
            ) : (
              <meshPhysicalMaterial
                color={theme.cockpitGlass}
                roughness={0.06}
                metalness={0.15}
                transmission={0.65}
                transparent
                opacity={0.85}
                ior={1.52}
                clearcoat={1.0}
                clearcoatRoughness={0.05}
                reflectivity={0.9}
              />
            )}
          </mesh>

          {/* Left Swept Delta Wing */}
          <mesh position={[-1.3, -0.05, -0.4]} rotation={[0, -0.2, 0.05]} castShadow>
            <boxGeometry args={[1.7, 0.08, 1.8]} />
            <meshStandardMaterial
              color={theme.primaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
              normalMap={brushedNormal}
            />
          </mesh>

          {/* Right Swept Delta Wing */}
          <mesh position={[1.3, -0.05, -0.4]} rotation={[0, 0.2, -0.05]} castShadow>
            <boxGeometry args={[1.7, 0.08, 1.8]} />
            <meshStandardMaterial
              color={theme.primaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
              normalMap={brushedNormal}
            />
          </mesh>

          {/* Left Winglet Stabilizer */}
          <mesh position={[-2.1, 0.3, -0.7]} rotation={[0, 0, 0.25]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.8]} />
            <meshStandardMaterial
              color={theme.secondaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
              normalMap={brushedNormal}
            />
          </mesh>

          {/* Right Winglet Stabilizer */}
          <mesh position={[2.1, 0.3, -0.7]} rotation={[0, 0, -0.25]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.8]} />
            <meshStandardMaterial
              color={theme.secondaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
              normalMap={brushedNormal}
            />
          </mesh>

          {/* Dual Engine Pod Bells: Dark refractory titanium with heat-discoloration lip */}
          <mesh position={[-0.6, 0.05, -1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.34, 0.7, 24]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.25}
              metalness={0.96}
            />
          </mesh>
          <mesh position={[0.6, 0.05, -1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.34, 0.7, 24]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.25}
              metalness={0.96}
            />
          </mesh>

          {/* Navigation Beacons: Red Port, Green Starboard, Strobe Dorsal */}
          <mesh position={[-2.15, 0.65, -0.7]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[2.15, 0.65, -0.7]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[0, 0.62, -1.3]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial ref={strobeRef} color="#ffffff" />
          </mesh>
        </group>
      )}

      {/* Dynamic Engine Exhaust Flame & Particle Plume */}
      <EngineExhaust
        throttle={throttle}
        isBoosting={isBoosting}
        color={theme.engineGlow}
        flareColor={theme.thrusterFlare}
      />
    </group>
  );
};
