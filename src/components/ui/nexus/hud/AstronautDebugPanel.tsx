import { useEffect, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';

export const AstronautDebugPanel: FC = () => {
  const {
    isDebugOpen,
    toggleDebugPanel,
    gameMode,
    setGameMode,
    teleportTo,
    refillSuitVitals,
    initiateLandingSequence,
    initiateTakeoffSequence,
    triggerWeatherEvent
  } = useNexusGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '`' || e.key === '~') {
        toggleDebugPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugPanel]);

  if (!isDebugOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-50 bg-slate-950/95 border border-cyan-500/50 rounded-lg p-4 w-80 font-mono text-xs text-slate-200 shadow-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-bold text-cyan-400 tracking-widest">NEXUS SIMULATION DEBUGGER</span>
        <button
          onClick={toggleDebugPanel}
          className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Mode: <span className="text-cyan-400 font-bold">{gameMode}</span></div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setGameMode('ASTRONAUT')}
            className="px-2 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 rounded text-cyan-200 text-center font-bold"
          >
            Force Astronaut
          </button>
          <button
            onClick={() => setGameMode('SPACE_FLIGHT')}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 text-center font-bold"
          >
            Force Space Flight
          </button>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Flight Sequencing</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={initiateLandingSequence}
            className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-600/50 rounded text-amber-200 text-center font-semibold"
          >
            Trigger Landing
          </button>
          <button
            onClick={initiateTakeoffSequence}
            className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-600/50 rounded text-purple-200 text-center font-semibold"
          >
            Trigger Takeoff
          </button>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Teleport Locations</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => teleportTo([0, -1.3, 2])}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded text-[11px] text-left"
          >
            • Colony Landing Pad
          </button>
          <button
            onClick={() => teleportTo([18, -1.2, 14])}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded text-[11px] text-left"
          >
            • Research Terminal
          </button>
          <button
            onClick={() => teleportTo([-38, 2.5, 45])}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded text-[11px] text-left"
          >
            • Alien Monolith
          </button>
          <button
            onClick={() => teleportTo([42, 1.8, -32])}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded text-[11px] text-left"
          >
            • Titanium Outcrop
          </button>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vitals & Weather</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={refillSuitVitals}
            className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 rounded text-emerald-200 font-semibold"
          >
            Refill Oxygen (100%)
          </button>
          <button
            onClick={() => triggerWeatherEvent('SOLAR_STORM')}
            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-600/50 rounded text-rose-200 font-semibold"
          >
            Solar Flare
          </button>
        </div>
      </div>
    </div>
  );
};
