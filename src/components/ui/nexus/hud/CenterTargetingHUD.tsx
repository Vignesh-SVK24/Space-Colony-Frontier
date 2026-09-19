import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Crosshair, Compass } from 'lucide-react';

export const CenterTargetingHUD: FC = () => {
  const { hoveredEntity, isScanning, scanProgress, startScan } = useNexusGameStore();

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between items-center p-6 font-mono select-none">
      {/* Top Center Waypoint Indicator */}
      <div className="mt-8 flex items-center gap-2 bg-[#0b0f19]/80 backdrop-blur-md px-3 py-1 rounded-xs border border-cyan-500/25 text-xs text-cyan-300 shadow-md">
        <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
        <span className="text-[10px] text-slate-400 uppercase">WAYPOINT:</span>
        <span className="font-bold">NORTHERN CRATER SECTOR 07</span>
        <span className="text-slate-400">�</span>
        <span className="text-emerald-400 font-bold">12.4 KM</span>
      </div>

      {/* Center Holographic Reticle */}
      <div className="relative flex flex-col items-center">
        {/* Reticle Brackets */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/80" />
          <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/80" />
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/80" />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/80" />

          {/* Crosshair Center */}
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />

          {/* Animated Scanning Ring */}
          {isScanning && (
            <div
              className="absolute inset-1 rounded-full border border-cyan-400/50 border-dashed animate-spin"
              style={{ animationDuration: '3s' }}
            />
          )}
        </div>

        {/* Hover Target Readout Card */}
        {hoveredEntity && (
          <div className="mt-3 flex flex-col items-center bg-[#0b0f19]/85 backdrop-blur-md px-3.5 py-2 rounded-xs border border-cyan-500/35 text-center shadow-xl animate-in fade-in duration-150">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>{hoveredEntity.type}</span>
            </div>
            <div className="text-xs font-bold text-slate-100 uppercase tracking-widest mt-0.5">
              {hoveredEntity.name}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              RANGE: {hoveredEntity.distanceM} M
            </div>

            {/* Scanning Progress */}
            {isScanning ? (
              <div className="w-36 mt-2 flex flex-col items-center">
                <span className="text-[9px] text-cyan-300 uppercase tracking-widest animate-pulse mb-1">
                  SPECTRAL ANALYSIS... {scanProgress}%
                </span>
                <div className="w-full bg-slate-900 h-1.5 rounded-xs overflow-hidden border border-cyan-500/30">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              hoveredEntity.actionPrompt && (
                <button
                  onClick={startScan}
                  className="mt-2 pointer-events-auto px-2.5 py-1 bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/60 rounded-xs text-[10px] text-cyan-200 font-bold tracking-wider uppercase transition cursor-pointer shadow-md"
                >
                  {hoveredEntity.actionPrompt}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Bottom Flight Controls Bar */}
      <div className="hidden md:flex items-center gap-3 bg-[#0b0f19]/80 backdrop-blur-md px-4 py-1.5 rounded-xs border border-cyan-500/20 text-[10px] text-slate-400">
        <span className="text-cyan-400 font-bold">FLIGHT:</span>
        <span>[W/S] ACCEL/REVERSE</span>
        <span>�</span>
        <span>[A/D] YAW & BANK</span>
        <span>�</span>
        <span>[R/F] PITCH</span>
        <span>�</span>
        <span>[SHIFT] BOOST</span>
        <span>�</span>
        <span>[SPACE] BRAKE</span>
        <span>�</span>
        <span>[V] COCKPIT/CHASE</span>
      </div>
    </div>
  );
};
