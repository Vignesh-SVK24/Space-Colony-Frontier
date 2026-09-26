import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Wind, Droplets, Apple, Zap, Users, Coins, Pause, Play, Radio, Volume2, VolumeX, Eye, EyeOff, Sliders } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';
import { useState } from 'react';

export const TopCommandBar: FC = () => {
  const {
    solDay,
    solTime,
    timeMultiplier,
    setTimeMultiplier,
    resources,
    colonyVitals,
    hudVisible,
    toggleHud,
    activeModal,
    openModal,
    closeModal
  } = useNexusGameStore();

  const [isMuted, setIsMuted] = useState(nexusAudio.getMuted());

  const toggleSound = () => {
    const muted = nexusAudio.toggleMute();
    setIsMuted(muted);
  };

  if (!hudVisible) {
    return (
      <div className="fixed top-3 right-3 z-40 pointer-events-auto">
        <button
          onClick={toggleHud}
          title="Restore Full HUD (H)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#080d1a]/80 hover:bg-[#0c1527]/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_12px_rgba(6,182,212,0.3)] transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">RESTORE HUD</span>
          <kbd className="text-[9px] bg-slate-800 px-1 rounded text-slate-300">H</kbd>
        </button>
      </div>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 sm:px-6 py-2 flex items-center justify-between pointer-events-none font-mono text-xs select-none">
      {/* Left: Sleek Colony Beacon Crest */}
      <div className="flex items-center gap-2.5 bg-[#080d1a]/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-cyan-500/25 pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="relative flex items-center justify-center">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-wider text-cyan-300">NEXUS</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-slate-200 tracking-wide text-[11px]">FRONTIER</span>
        </div>
        <div className="h-3 w-px bg-cyan-500/20" />
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold tracking-wider">
          {colonyVitals.overallStatus}
        </span>
      </div>

      {/* Center: Tactical Sol & Simulation Speed Controls */}
      <div className="hidden md:flex items-center gap-3 bg-[#080d1a]/85 backdrop-blur-md px-3.5 py-1.5 rounded-md border border-cyan-500/25 pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">AETHELIA-IV</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-semibold text-slate-200">SOL {String(solDay).padStart(3, '0')}</span>
          <span className="text-cyan-400 font-bold">{solTime}</span>
        </div>

        <div className="h-3.5 w-px bg-cyan-500/20" />

        {/* Speed Multipliers (Clean 1x, 2x, 5x) */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded border border-cyan-500/20">
          <button
            onClick={() => setTimeMultiplier(timeMultiplier === 0 ? 1 : 0)}
            title="Pause / Resume (P)"
            className={`p-1 rounded transition cursor-pointer ${timeMultiplier === 0 ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {timeMultiplier === 0 ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setTimeMultiplier(1)}
            title="Normal Speed 1x"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${timeMultiplier === 1 ? 'bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            1x
          </button>
          <button
            onClick={() => setTimeMultiplier(2)}
            title="Fast Speed 2x"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${timeMultiplier === 2 ? 'bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            2x
          </button>
          <button
            onClick={() => setTimeMultiplier(5)}
            title="Ultra Speed 5x"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${timeMultiplier === 5 ? 'bg-cyan-500/30 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            5x
          </button>
        </div>

        <div className="h-3.5 w-px bg-cyan-500/20" />

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-1 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        {/* Cinematic HUD Toggle */}
        <button
          onClick={toggleHud}
          title="Toggle Cinematic Flight View (H)"
          className="p-1 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <EyeOff className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300" />
        </button>

        {/* Graphics & Calibration Settings */}
        <button
          onClick={() => (activeModal === 'graphics' ? closeModal() : openModal('graphics'))}
          title="Graphics & Performance Pipeline (O)"
          className="p-1 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300" />
        </button>
      </div>

      {/* Right: Sleek Colony Resource Ribbon */}
      <div className="flex items-center gap-2 sm:gap-3 bg-[#080d1a]/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-cyan-500/25 pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {/* Oxygen */}
        <div className="flex items-center gap-1.5 group cursor-default" title="Oxygen Life Support">
          <Wind className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-[11px] font-bold text-sky-200">
            {Math.round(resources.oxygen.current)}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Water */}
        <div className="flex items-center gap-1.5 group cursor-default" title="Potable Water Reserves">
          <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[11px] font-bold text-blue-200">
            {Math.round(resources.water.current)}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Food */}
        <div className="flex items-center gap-1.5 group cursor-default" title="Colony Food Rations">
          <Apple className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-bold text-emerald-200">
            {Math.round(resources.food.current)}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Energy */}
        <div className="flex items-center gap-1.5 group cursor-default" title="Power Grid Output">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold text-amber-200">
            {Math.round(resources.energy.current)}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Population */}
        <div className="flex items-center gap-1.5 group cursor-default" title="Colony Population / Housing Limit">
          <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-[11px] font-bold text-purple-200">
            {colonyVitals.population}/{colonyVitals.maxPopulation}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Credits */}
        <div className="flex items-center gap-1.5 group cursor-default" title="Treasury Credits">
          <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span className="text-[11px] font-bold text-yellow-300">
            {resources.credits.current.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
};
