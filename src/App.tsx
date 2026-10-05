import { type FC } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useMultiplayerStore } from './multiplayer/useMultiplayerStore';

// Multiplayer Views
import { LandingPage } from './components/ui/LandingPage';
import { LobbyView } from './components/ui/LobbyView';
import { MatchResultScreen } from './components/ui/MatchResultScreen';

// 3D Battle Scene & HUD
import { BattleScene } from './components/three/scene/BattleScene';
import { BattleHUD } from './components/ui/nexus/hud/BattleHUD';
import { BoundaryWarning } from './components/ui/nexus/hud/BoundaryWarning';
import { VirtualJoystick } from './components/ui/nexus/hud/VirtualJoystick';

export const App: FC = () => {
  const appView = useMultiplayerStore((state) => state.appView);
  const matchSessionId = useMultiplayerStore((state) => state.matchSessionId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] font-mono select-none text-slate-100">
      {appView === 'LANDING' && <LandingPage />}

      {appView === 'LOBBY' && <LobbyView />}

      {(appView === 'BATTLE' || appView === 'RESULT') && (
        <>
          {/* 3D Battle Scene Viewport */}
          <ErrorBoundary fallbackTitle="Nexus Battle Failure">
            <BattleScene />
          </ErrorBoundary>

          {/* Battle HUD Overlays */}
          <BattleHUD key={`hud-${matchSessionId}`} />
          <BoundaryWarning key={`warn-${matchSessionId}`} />

          {/* Mobile Flight Controls */}
          <VirtualJoystick key={`joy-${matchSessionId}`} />

          {/* Post-Match Result Screen Overlay */}
          {appView === 'RESULT' && <MatchResultScreen />}
        </>
      )}
    </div>
  );
};

export default App;
