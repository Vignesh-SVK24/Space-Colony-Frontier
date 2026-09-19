import { useEffect, useState, type FC } from 'react';
import * as THREE from 'three';
import { VISUAL_THEME, SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { loadGLBAsset } from '../../../assets/AssetLoader';
import { EngineExhaust } from './EngineExhaust';

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
  const theme = VISUAL_THEME.spaceshipPaintSchemes[paintScheme] || VISUAL_THEME.spaceshipPaintSchemes.default;

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

  return (
    <group>
      {externalModel ? (
        <primitive object={externalModel} />
      ) : (
        /* Rich Procedural PBR Spaceship */
        <group>
          {/* Main Fuselage Body (Aerodynamic swept lifting body) */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.9, 3.6, 6]} />
            <meshStandardMaterial
              color={damaged ? '#7f1d1d' : theme.primaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
            />
          </mesh>

          {/* Secondary Upper Armor Dorsal Ridge */}
          <mesh position={[0, 0.28, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <boxGeometry args={[0.65, 2.2, 0.35]} />
            <meshStandardMaterial
              color={theme.secondaryHull}
              roughness={theme.roughness * 0.9}
              metalness={theme.metalness}
            />
          </mesh>

          {/* Cockpit Canopy Glass (PBR Reflective / Transmissive) */}
          <mesh position={[0, 0.42, 0.6]} rotation={[Math.PI / 4, 0, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
            <meshStandardMaterial
              color={theme.cockpitGlass}
              roughness={0.1}
              metalness={0.9}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Left Swept Delta Wing */}
          <mesh position={[-1.3, -0.05, -0.4]} rotation={[0, -0.2, 0.05]} castShadow>
            <boxGeometry args={[1.7, 0.08, 1.8]} />
            <meshStandardMaterial
              color={theme.primaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
            />
          </mesh>

          {/* Right Swept Delta Wing */}
          <mesh position={[1.3, -0.05, -0.4]} rotation={[0, 0.2, -0.05]} castShadow>
            <boxGeometry args={[1.7, 0.08, 1.8]} />
            <meshStandardMaterial
              color={theme.primaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
            />
          </mesh>

          {/* Left Winglet Stabilizer */}
          <mesh position={[-2.1, 0.3, -0.7]} rotation={[0, 0, 0.25]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.8]} />
            <meshStandardMaterial
              color={theme.secondaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
            />
          </mesh>

          {/* Right Winglet Stabilizer */}
          <mesh position={[2.1, 0.3, -0.7]} rotation={[0, 0, -0.25]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.8]} />
            <meshStandardMaterial
              color={theme.secondaryHull}
              roughness={theme.roughness}
              metalness={theme.metalness}
            />
          </mesh>

          {/* Dual Engine Pod Bells */}
          <mesh position={[-0.6, 0.05, -1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.32, 0.7, 16]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.4}
              metalness={0.9}
            />
          </mesh>
          <mesh position={[0.6, 0.05, -1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.32, 0.7, 16]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.4}
              metalness={0.9}
            />
          </mesh>

          {/* Navigation Beacons: Red Port (Left), Green Starboard (Right), White Dorsal Strobe */}
          <mesh position={[-2.15, 0.65, -0.7]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[2.15, 0.65, -0.7]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[0, 0.6, -1.3]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
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
