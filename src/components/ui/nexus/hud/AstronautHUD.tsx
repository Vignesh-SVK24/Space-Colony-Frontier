import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';

export const AstronautHUD: FC = () => {
  const {
    gameMode,
    hudVisible,
    suitOxygen,
    suitEnergy,
    suitCondition,
    astronautHeading,
    activeBiome,
    astronautScannerActive,
    hoveredEntity
  } = useNexusGameStore();

  if (gameMode !== 'ASTRONAUT' || !hudVisible) return null;

  // Heading formatted as compass directions
  const degrees = Math.round(((-astronautHeading * 180) / Math.PI + 360) % 360);
  const getCompassDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const isLowO2 = suitOxygen <= 20;
  const isCautionO2 = suitOxygen <= 40;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 font-mono select-none">
      {/* Top Header: Compass & Active Biome Ribbon */}
      <div className="w-full flex items-center justify-center">
        <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-lg px-6 py-2 flex items-center space-x-8 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
          {/* Compass Readout */}
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 font-bold text-sm tracking-widest">
              {getCompassDir(degrees)}
            </span>
            <span className="text-slate-400 text-xs">{degrees}°</span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Biome Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-semibold tracking-wider text-slate-200">
              {activeBiome.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Scanner Status */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400">OMNITOOL:</span>
            <span className={`text-[10px] font-bold tracking-wider ${astronautScannerActive ? 'text-cyan-400' : 'text-slate-500'}`}>
              {astronautScannerActive ? 'ACTIVE [F]' : 'STANDBY [F]'}
            </span>
          </div>
        </div>
      </div>

      {/* Holographic Visor Scanner Mode Overlay */}
      {astronautScannerActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Holographic Circular Reticle */}
          <div className="relative w-64 h-64 border border-cyan-400/40 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-48 h-48 border border-dashed border-cyan-400/60 rounded-full" />
            <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#38bdf8]" />
            <div className="absolute -top-6 text-[10px] tracking-widest text-cyan-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
              SPECTRAL SCANNER MATRIX
            </div>
            <div className="absolute -bottom-6 text-[10px] tracking-widest text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700">
              RANGE: 45M · RESOLUTION: SUB-MICRON
            </div>
          </div>
        </div>
      )}

      {/* Center Proximity Interaction Prompt */}
      {hoveredEntity && (
        <div className="absolute left-1/2 bottom-28 -translate-x-1/2 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-400/70 rounded-lg px-6 py-3 shadow-[0_0_25px_rgba(56,189,248,0.25)] flex flex-col items-center space-y-1 animate-bounce">
            <div className="text-[10px] tracking-widest text-cyan-400 uppercase font-semibold">
              {hoveredEntity.type} · {hoveredEntity.distanceM}M
            </div>
            <div className="text-sm font-bold tracking-wider text-slate-100">
              {hoveredEntity.actionPrompt || `PRESS [E] TO INTERACT`}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: EVA Suit Telemetry & Controls Ribbon */}
      <div className="w-full flex items-end justify-between">
        {/* Left: Suit Vitals Gauges */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-4 w-72 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-200">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>EVA SUIT TELEMETRY</span>
            </span>
            <span className="text-[10px] text-slate-400">MK-IV SUIT</span>
          </div>

          {/* Suit Oxygen Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">OXYGEN RESERVE</span>
              <span className={`font-bold ${isLowO2 ? 'text-red-400 animate-pulse' : isCautionO2 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {Math.round(suitOxygen)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isLowO2
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                    : isCautionO2
                    ? 'bg-amber-400'
                    : 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, suitOxygen))}%` }}
              />
            </div>
          </div>

          {/* Suit Energy Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">SUIT ENERGY</span>
              <span className="font-bold text-amber-400">{Math.round(suitEnergy)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${suitEnergy}%` }}
              />
            </div>
          </div>

          {/* Environmental Telemetry */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            <div>TEMP: <span className="text-slate-200 font-bold">-16°C</span></div>
            <div>GRAV: <span className="text-slate-200 font-bold">0.92G</span></div>
            <div>SUIT: <span className="text-emerald-400 font-bold">{suitCondition}%</span></div>
          </div>
        </div>

        {/* Right: Astronaut Controls Cheatsheet */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 space-y-1.5 shadow-xl">
          <div className="text-[10px] font-bold text-cyan-400 tracking-wider">ASTRONAUT CONTROLS</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-400">
            <div><span className="text-slate-200 font-bold">[W A S D]</span> Move</div>
            <div><span className="text-slate-200 font-bold">[SHIFT]</span> Sprint</div>
            <div><span className="text-slate-200 font-bold">[E]</span> Interact / Board</div>
            <div><span className="text-slate-200 font-bold">[F]</span> Omnitool Scan</div>
            <div><span className="text-slate-200 font-bold">[MOUSE DRAG]</span> Orbit</div>
            <div><span className="text-slate-200 font-bold">[SCROLL]</span> Zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
};
