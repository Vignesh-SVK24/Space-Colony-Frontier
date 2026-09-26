import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import { DeepSpaceSkybox } from '../celestial/DeepSpaceSkybox';
import { SunSystem } from '../celestial/SunSystem';
import { DistantPlanets } from '../celestial/DistantPlanets';
import { MoonSystem } from '../celestial/MoonSystem';
import { ExpandedAsteroidBelts } from '../asteroids/ExpandedAsteroidBelts';
import { CinematicPostProcessing } from './CinematicPostProcessing';
import { LocalPlayerShip } from '../battle/LocalPlayerShip';
import { RemotePlayerShip } from '../battle/RemotePlayerShip';
import { LaserProjectiles } from '../battle/LaserProjectiles';
import { BattleArena } from '../battle/BattleArena';
import { SoloAIBot } from '../battle/SoloAIBot';
import { generateSpaceCubeEnvironment } from '../../../utils/pbrTextureGenerator';
import { getViewDistanceFar } from '../../../config/graphicsConfig';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const BattleScene: React.FC = () => {
  const graphicsSettings = useNexusGameStore((state) => state.graphicsSettings);
  const isSolo = useMultiplayerStore((state) => state.isSolo);
  const far = getViewDistanceFar(graphicsSettings.viewDistance);

  return (
    <Canvas
      dpr={[1, 2]}
      shadows={graphicsSettings.shadows ? 'soft' : false}
      camera={{ fov: 55, near: 0.1, far }}
      gl={{
        antialias: graphicsSettings.antiAliasing,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      onCreated={({ scene }) => {
        scene.environment = generateSpaceCubeEnvironment();
      }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#ffffff', '#000000', 0.2]} />
      
      {/* Environment */}
      <DeepSpaceSkybox />
      <SunSystem />
      <DistantPlanets />
      <MoonSystem />
      <ExpandedAsteroidBelts />
      
      {/* Battle Components */}
      <BattleArena />
      <LocalPlayerShip />
      <RemotePlayerShip />
      <LaserProjectiles />
      {isSolo && <SoloAIBot />}
      
      {/* Post Processing */}
      <CinematicPostProcessing />
    </Canvas>
  );
};
