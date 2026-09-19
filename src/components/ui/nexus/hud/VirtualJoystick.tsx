import { useState, type FC } from 'react';
import { Zap, Shield, Navigation, Crosshair } from 'lucide-react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const VirtualJoystick: FC = () => {
  const { startScan, addAlert } = useNexusGameStore();
  const [touchActive, setTouchActive] = useState(false);

  const handleBoost = () => {
    nexusAudio.playConfirm();
    addAlert({ type: 'info', title: 'BOOST ENGAGED', message: 'Afterburners activated via touch flight controls.' });
  };

  const handleBrake = () => {
    nexusAudio.playClick(900);
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-16 z-25 pointer-events-none px-4 flex justify-between items-end font-mono select-none">
      {/* Left Touch Flight Pad (Steering & Forward Thrust) */}
      <div className="pointer-events-auto flex flex-col items-center gap-1">
        <div
          onTouchStart={() => setTouchActive(true)}
          onTouchEnd={() => setTouchActive(false)}
          className="w-24 h-24 rounded-full bg-[#0b0f19]/70 backdrop-blur-md border border-cyan-500/40 relative flex items-center justify-center shadow-lg active:border-cyan-300"
        >
          <div className="absolute top-1 text-[9px] text-cyan-400 font-bold">W</div>
          <div className="absolute bottom-1 text-[9px] text-cyan-400 font-bold">S</div>
          <div className="absolute left-1 text-[9px] text-cyan-400 font-bold">A</div>
          <div className="absolute right-1 text-[9px] text-cyan-400 font-bold">D</div>
          <div className={`w-10 h-10 rounded-full border border-cyan-400/60 bg-cyan-500/20 flex items-center justify-center transition ${touchActive ? 'scale-125 bg-cyan-500/40' : ''}`}>
            <Navigation className="w-4 h-4 text-cyan-300" />
          </div>
        </div>
        <span className="text-[9px] text-slate-400 uppercase tracking-widest">
          FLIGHT STICK
        </span>
      </div>

      {/* Right Touch Action Controls (Boost, Brake, Scan) */}
      <div className="pointer-events-auto flex flex-col gap-2 items-end">
        <div className="flex gap-2">
          <button
            onTouchStart={handleBoost}
            onClick={handleBoost}
            className="w-12 h-12 rounded-full bg-cyan-500/25 border border-cyan-400 text-cyan-200 flex flex-col items-center justify-center text-[9px] font-bold shadow-md active:scale-95 transition"
          >
            <Zap className="w-4 h-4" />
            <span>BOOST</span>
          </button>

          <button
            onTouchStart={handleBrake}
            onClick={handleBrake}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 flex flex-col items-center justify-center text-[9px] font-bold shadow-md active:scale-95 transition"
          >
            <Shield className="w-4 h-4" />
            <span>BRAKE</span>
          </button>
        </div>

        <button
          onClick={startScan}
          className="px-4 py-2 rounded-xs bg-[#0b0f19]/90 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 text-xs font-bold shadow-lg uppercase tracking-wider active:bg-cyan-500/30"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>SCAN [E]</span>
        </button>
      </div>
    </div>
  );
};
