import { useEffect, useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';

export const LandingTransitionOverlay: FC = () => {
  const { gameMode, finishLandingTransition } = useNexusGameStore();
  const [opacity, setOpacity] = useState(0);
  const [phaseText, setPhaseText] = useState('');

  const isTransitioning = gameMode === 'LANDING_TRANSITION' || gameMode === 'ENTERING_SHIP';

  useEffect(() => {
    if (gameMode === 'LANDING_TRANSITION') {
      // 2-second cinematic blank transition
      // 0.0s - 0.8s: Fade to black
      setOpacity(1);
      setPhaseText('ATMOSPHERIC TOUCHDOWN CONFIRMED // INITIALIZING EVA SUIT');

      const timerMiddle = setTimeout(() => {
        setPhaseText('AETHELIA-IV SURFACE CONDITIONS STABLE · DEPLOYING COMMANDER');
      }, 1000);

      const timerFinish = setTimeout(() => {
        setOpacity(0);
        finishLandingTransition();
      }, 2000);

      return () => {
        clearTimeout(timerMiddle);
        clearTimeout(timerFinish);
      };
    } else if (gameMode === 'ENTERING_SHIP') {
      setOpacity(1);
      setPhaseText('BOARDING RECON CRAFT // SEALING AIRLOCK & PRESSURIZING COCKPIT');
      const timer = setTimeout(() => {
        setOpacity(0);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      setPhaseText('');
    }
  }, [gameMode, finishLandingTransition]);

  if (!isTransitioning && opacity === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-[#02040a] transition-opacity duration-700 ease-in-out"
      style={{ opacity }}
    >
      <div className="flex flex-col items-center space-y-4 max-w-lg text-center px-6">
        {/* Animated Scan Line */}
        <div className="w-16 h-1 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_15px_#38bdf8]" />

        <div className="text-xs tracking-[0.35em] text-cyan-400/80 uppercase font-semibold">
          Nexus Planetary Avionics v4.2
        </div>

        <div className="text-lg md:text-xl font-bold tracking-widest text-slate-100 uppercase">
          {phaseText}
        </div>

        <div className="flex items-center space-x-6 text-[10px] tracking-widest text-slate-400">
          <span>SURFACE GRAVITY: 0.92G</span>
          <span>ATMOSPHERE: TRACE CO2</span>
          <span>SECTOR: ALPHA-01</span>
        </div>
      </div>
    </div>
  );
};
