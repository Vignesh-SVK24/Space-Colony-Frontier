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
import { LaserBeam3D } from '../battle/LaserBeam3D';
import { SolarBeam3D } from '../battle/SolarBeam3D';
import { LeadReticle3D } from '../battle/LeadReticle3D';
import { BattleArena } from '../battle/BattleArena';
import { SoloAIBot } from '../battle/SoloAIBot';
import { generateSpaceCubeEnvironment } from '../../../utils/pbrTextureGenerator';
import { getViewDistanceFar } from '../../../config/graphicsConfig';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

import { isMobileDevice, getOptimalDPR } from '../../../utils/mobileOptimization';

export const BattleScene: React.FC = () => {
  const graphicsSettings = useNexusGameStore((state) => state.graphicsSettings);
  const isSolo = useMultiplayerStore((state) => state.isSolo);
  const otherPlayers = useMultiplayerStore((state) => state.otherPlayers);
  const opponentState = useMultiplayerStore((state) => state.opponentState);
  const far = getViewDistanceFar(graphicsSettings.viewDistance);
  const isMobile = isMobileDevice();
  const dpr = getOptimalDPR();

  // Render up to 3 opponents in 4-player match
  const remoteShips = otherPlayers.length > 0 ? otherPlayers : (opponentState ? [opponentState] : []);

  return (
    <Canvas
      dpr={dpr}
      shadows={!isMobile && graphicsSettings.shadows ? 'soft' : false}
      camera={{ fov: 55, near: 0.1, far }}
      gl={{
        antialias: !isMobile && graphicsSettings.antiAliasing,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        stencil: false,
        depth: true
      }}
      onCreated={({ scene }) => {
        scene.environment = generateSpaceCubeEnvironment();
      }}
      className="w-full h-full touch-none select-none"
    >
      <ambientLight intensity={0.4} />
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
      {remoteShips.map((ship) => (
        <RemotePlayerShip key={ship.id} player={ship} />
      ))}
      <LaserProjectiles />
      <LaserBeam3D />
      <SolarBeam3D />
      <LeadReticle3D />
      {isSolo && <SoloAIBot />}

      {/* Post Processing: only on desktop devices with high settings */}
      {!isMobile && graphicsSettings.postProcessing !== 'off' && <CinematicPostProcessing />}
    </Canvas>
  );
};

