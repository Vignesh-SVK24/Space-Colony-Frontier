import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';

export const CenterTargetingHUD: FC = () => {
  const { hoveredEntity, isScanning, scanProgress, startScan } = useNexusGameStore();

  if (!hoveredEntity) return null;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center font-mono select-none">
      {/* Holographic Reticle Center */}
      <div className="relative flex flex-col items-center">
        {/* Reticle Brackets */}
        <div className="relative w-28 h-28 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          {/* Top-Left */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80" />
          {/* Top-Right */}
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80" />
          {/* Bottom-Left */}
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80" />
          {/* Bottom-Right */}
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80" />

          {/* Center Crosshair Pip */}
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />

          {/* Circular Scan Ring */}
          {isScanning && (
            <div
              className="absolute inset-2 rounded-full border border-cyan-400/40 border-dashed animate-spin"
              style={{ animationDuration: '3s' }}
            />
          )}
        </div>

        {/* Target Readout Card */}
        <div className="mt-3 flex flex-col items-center bg-[#0b0f19]/80 backdrop-blur-md px-3 py-1.5 rounded-xs border border-cyan-500/30 text-center">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            ? {hoveredEntity.type}
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
                SCANNING FREQUENCIES... {scanProgress}%
              </span>
              <div className="w-full bg-slate-900 h-1 rounded-xs overflow-hidden border border-cyan-500/30">
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
                className="mt-2 pointer-events-auto px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-xs text-[10px] text-cyan-200 font-bold tracking-wider uppercase transition cursor-pointer"
              >
                {hoveredEntity.actionPrompt}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
