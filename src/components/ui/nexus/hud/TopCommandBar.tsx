import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusStatus } from '../NexusStatus';
import { Wind, Droplets, Apple, Zap, Users, Coins, Pause, Radio, Volume2, VolumeX } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';
import { useState } from 'react';

export const TopCommandBar: FC = () => {
  const {
    solDay,
    solTime,
    timeMultiplier,
    setTimeMultiplier,
    resources,
    colonyVitals
  } = useNexusGameStore();

  const [isMuted, setIsMuted] = useState(nexusAudio.getMuted());

  const toggleSound = () => {
    const muted = nexusAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 sm:px-6 py-2.5 flex items-center justify-between pointer-events-none font-mono text-xs select-none">
      {/* Left: Nexus Identifier */}
      <div className="flex items-center gap-3 bg-[#0b0f19]/85 backdrop-blur-md px-3 py-1.5 rounded-xs border border-cyan-500/25 pointer-events-auto shadow-lg">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-cyan-300 tracking-wider">NEXUS</span>
              <span className="text-slate-500 text-[10px]">/</span>
              <span className="text-slate-200 text-[11px] font-semibold tracking-wide">FRONTIER</span>
            </div>
            <span className="text-[9px] text-cyan-500/80 uppercase tracking-widest">
              COLONY COMMAND OS
            </span>
          </div>
        </div>
        <div className="h-4 w-px bg-cyan-500/20" />
        <NexusStatus status="healthy" label={colonyVitals.overallStatus} />
      </div>

      {/* Center: World State Telemetry */}
      <div className="hidden md:flex items-center gap-4 bg-[#0b0f19]/85 backdrop-blur-md px-4 py-1.5 rounded-xs border border-cyan-500/25 pointer-events-auto shadow-lg">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">PLANET</span>
          <span className="text-cyan-300 font-bold">AETHELIA-IV</span>
        </div>
        <div className="h-3 w-px bg-cyan-500/20" />
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">SOL</span>
          <span className="text-slate-100 font-semibold">{String(solDay).padStart(3, '0')}</span>
          <span className="text-cyan-400 font-semibold">{solTime}</span>
        </div>
        <div className="h-3 w-px bg-cyan-500/20" />

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded border border-cyan-500/20">
          <button
            onClick={() => setTimeMultiplier(0)}
            title="Pause Simulation (Space)"
            className={`p-1 rounded-xs transition ${timeMultiplier === 0 ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Pause className="w-3 h-3" />
          </button>
          <button
            onClick={() => setTimeMultiplier(1)}
            title="Normal Speed 1x (1)"
            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold transition ${timeMultiplier === 1 ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            1?
          </button>
          <button
            onClick={() => setTimeMultiplier(2)}
            title="Fast Speed 2x (2)"
            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold transition ${timeMultiplier === 2 ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            2?
          </button>
          <button
            onClick={() => setTimeMultiplier(5)}
            title="Ultra Speed 5x (3)"
            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold transition ${timeMultiplier === 5 ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            5?
          </button>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-1 rounded-xs text-slate-400 hover:text-cyan-300 transition"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>

      {/* Right: Resource Telemetry Strip */}
      <div className="flex items-center gap-2 sm:gap-3 bg-[#0b0f19]/85 backdrop-blur-md px-3 py-1.5 rounded-xs border border-cyan-500/25 pointer-events-auto shadow-lg overflow-x-auto">
        {/* Oxygen */}
        <div className="flex items-center gap-1.5" title="Oxygen Life Support">
          <Wind className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-sky-200 leading-tight">
              {Math.round(resources.oxygen.current)}
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">O2</span>
          </div>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Water */}
        <div className="flex items-center gap-1.5" title="Potable Water Reserve">
          <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-blue-200 leading-tight">
              {Math.round(resources.water.current)}
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">H2O</span>
          </div>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Food */}
        <div className="flex items-center gap-1.5" title="Colony Food Rations">
          <Apple className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-emerald-200 leading-tight">
              {Math.round(resources.food.current)}
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">FOOD</span>
          </div>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Energy */}
        <div className="flex items-center gap-1.5" title="Power Grid Reserve">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-200 leading-tight">
              {Math.round(resources.energy.current)}
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">PWR</span>
          </div>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Population */}
        <div className="flex items-center gap-1.5" title="Colonists / Housing Cap">
          <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-purple-200 leading-tight">
              {colonyVitals.population}/{colonyVitals.maxPopulation}
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">POP</span>
          </div>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Credits */}
        <div className="flex items-center gap-1.5" title="Colony Treasury Credits">
          <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-yellow-300 leading-tight">
              {resources.credits.current.toLocaleString()}
            </span>
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">CR</span>
          </div>
        </div>
      </div>
    </header>
  );
};
