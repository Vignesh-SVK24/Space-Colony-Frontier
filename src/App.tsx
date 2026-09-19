import { useEffect, type FC } from 'react';
import { SceneRoot } from './components/three/scene/SceneRoot';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useNexusGameStore } from './state/useNexusGameStore';

// Nexus HUD Layers
import { TopCommandBar } from './components/ui/nexus/hud/TopCommandBar';
import { BottomCommandDock } from './components/ui/nexus/hud/BottomCommandDock';
import { LeftOperationsPanel } from './components/ui/nexus/hud/LeftOperationsPanel';
import { RightIntelligencePanel } from './components/ui/nexus/hud/RightIntelligencePanel';
import { CenterTargetingHUD } from './components/ui/nexus/hud/CenterTargetingHUD';
import { FloatingAlertStack } from './components/ui/nexus/hud/FloatingAlertStack';
import { VirtualJoystick } from './components/ui/nexus/hud/VirtualJoystick';

// Nexus Tactical Modals
import { NexusBuildModal } from './components/ui/nexus/modals/NexusBuildModal';
import { NexusResearchModal } from './components/ui/nexus/modals/NexusResearchModal';
import { NexusMapModal } from './components/ui/nexus/modals/NexusMapModal';
import { NexusColonyModal } from './components/ui/nexus/modals/NexusColonyModal';
import { NexusShipModal } from './components/ui/nexus/modals/NexusShipModal';
import { NexusAlienModal } from './components/ui/nexus/modals/NexusAlienModal';

export const App: FC = () => {
  const {
    activeModal,
    openModal,
    closeModal,
    timeMultiplier,
    setTimeMultiplier,
    tickSimulation,
    startScan,
    hoveredEntity,
    toggleHud
  } = useNexusGameStore();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();

      if (e.key === 'Escape') {
        if (activeModal) closeModal();
        return;
      }

      // 'P' pauses/resumes simulation (leaving Space exclusively for flight brake)
      if (key === 'P') {
        setTimeMultiplier(timeMultiplier === 0 ? 1 : 0);
        return;
      }

      // 'H' toggles cinematic mode / HUD visibility
      if (key === 'H') {
        toggleHud();
        return;
      }

      if (key === '1') setTimeMultiplier(1);
      if (key === '2') setTimeMultiplier(2);
      if (key === '3') setTimeMultiplier(5);

      if (key === 'B') activeModal === 'build' ? closeModal() : openModal('build');
      if (key === 'T') activeModal === 'research' ? closeModal() : openModal('research');
      if (key === 'M') activeModal === 'map' ? closeModal() : openModal('map');
      if (key === 'K') activeModal === 'ship' ? closeModal() : openModal('ship');
      if (key === 'G') activeModal === 'colony' ? closeModal() : openModal('colony');
      if (key === 'X') activeModal === 'alien' ? closeModal() : openModal('alien');

      if (key === 'E' && hoveredEntity) {
        startScan();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, openModal, closeModal, timeMultiplier, setTimeMultiplier, startScan, hoveredEntity, toggleHud]);

  // Simulation tick loop
  useEffect(() => {
    if (timeMultiplier === 0) return;
    const intervalTime = 1000 / (10 * timeMultiplier);
    const timer = setInterval(() => {
      tickSimulation();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [timeMultiplier, tickSimulation]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] font-mono select-none text-slate-100">
      {/* 3D Scene Viewport (Visual Hero) */}
      <ErrorBoundary fallbackTitle="Nexus Viewport Failure">
        <SceneRoot />
      </ErrorBoundary>

      {/* Futuristic Nexus HUD Elements */}
      <TopCommandBar />
      <LeftOperationsPanel />
      <RightIntelligencePanel />
      <CenterTargetingHUD />
      <FloatingAlertStack />
      <BottomCommandDock />
      <VirtualJoystick />

      {/* Tactical Modals */}
      <NexusBuildModal />
      <NexusResearchModal />
      <NexusMapModal />
      <NexusColonyModal />
      <NexusShipModal />
      <NexusAlienModal />
    </div>
  );
};

export default App;
