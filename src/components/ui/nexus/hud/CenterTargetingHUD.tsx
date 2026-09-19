import { useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Crosshair, HelpCircle, ChevronDown, AlertTriangle } from 'lucide-react';

export const CenterTargetingHUD: FC = () => {
  const {
    hoveredEntity,
    isScanning,
    scanProgress,
    startScan,
    hudVisible,
    flightSpeed,
    isBoosting,
    isBraking,
    shipPosition,
    weatherEvent
  } = useNexusGameStore();

  const [controlsOpen, setControlsOpen] = useState(true);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between items-center p-4 sm:p-6 font-mono select-none">
      {/* Top Space Weather Alert Banner */}
      {hudVisible && weatherEvent !== 'CALM' ? (
        <div className="mt-8 flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/85 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs shadow-lg animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] uppercase font-bold tracking-wider">
            SPACE WEATHER ADVISORY: {weatherEvent.replace(/_/g, ' ')}
          </span>
        </div>
      ) : (
        <div className="h-10" />
      )}

      {/* Center Holographic Reticle & Flight Telemetry */}
      <div className="relative flex items-center justify-center">
        {/* Left Telemetry: Digital Speedometer */}
        {hudVisible && (
          <div className="absolute right-20 flex items-center gap-2 pr-3 py-1 text-right">
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-base sm:text-lg font-black tracking-wider transition-colors duration-150 ${
                    isBoosting ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : isBraking ? 'text-rose-400' : 'text-cyan-300'
                  }`}
                >
                  {flightSpeed}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">M/S</span>
              </div>
              <span
                className={`text-[8px] font-bold tracking-widest uppercase transition-colors ${
                  isBoosting ? 'text-amber-400' : isBraking ? 'text-rose-400' : 'text-slate-500'
                }`}
              >
                {isBoosting ? 'BOOST' : isBraking ? 'AIRBRAKE' : 'CRUISE'}
              </span>
            </div>
            <div className="w-1 h-8 rounded-full bg-slate-900 border border-cyan-500/20 overflow-hidden flex flex-col justify-end">
              <div
                className={`w-full transition-all duration-100 ${
                  isBoosting ? 'bg-amber-400' : isBraking ? 'bg-rose-400' : 'bg-cyan-400'
                }`}
                style={{ height: `${Math.min(100, (flightSpeed / 95) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Right Telemetry: 3D Vector & Orbital Altitude */}
        {hudVisible && (
          <div className="absolute left-20 flex items-center gap-2 pl-3 py-1 text-left">
            <div className="w-1 h-8 rounded-full bg-slate-900 border border-cyan-500/20 overflow-hidden flex flex-col justify-end">
              <div className="w-full bg-cyan-400 transition-all duration-100" style={{ height: '70%' }} />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-cyan-300 font-bold tracking-wider">
                  ALT {(Math.max(10, shipPosition[1] * 2.5)).toFixed(1)}
                </span>
                <span className="text-[8px] text-slate-400 font-bold">KM</span>
              </div>
              <span className="text-[8px] font-mono text-slate-400 whitespace-nowrap">
                X {(shipPosition[0] >= 0 ? '+' : '') + shipPosition[0].toFixed(1)} Z {(shipPosition[2] >= 0 ? '+' : '') + shipPosition[2].toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Center Reticle */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {/* Subtle Outer Ring */}
          <div
            className={`absolute inset-0 rounded-full border transition-all duration-200 ${
              hoveredEntity ? 'border-cyan-400 scale-110 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'border-cyan-500/25'
            }`}
          />

          {/* Corner Lock Brackets */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/70" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/70" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/70" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/70" />

          {/* Center Aiming Pip */}
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
              isBoosting
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-125'
                : 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]'
            }`}
          />

          {/* Scanning Ring Animation */}
          {isScanning && (
            <div
              className="absolute -inset-2 rounded-full border-2 border-cyan-400/60 border-dashed animate-spin"
              style={{ animationDuration: '2s' }}
            />
          )}
        </div>

        {/* Hover Target Readout Card (when aiming at objects) */}
        {hoveredEntity && (
          <div className="absolute top-24 flex flex-col items-center bg-[#080d1a]/90 backdrop-blur-md px-3.5 py-2 rounded-md border border-cyan-400/50 text-center shadow-[0_4px_24px_rgba(0,0,0,0.8)] animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-bold text-cyan-200 tracking-wider uppercase">
                {hoveredEntity.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {hoveredEntity.distanceM}M
              </span>
            </div>

            {/* Scanning Progress Bar */}
            {isScanning ? (
              <div className="w-40 mt-2 flex flex-col items-center">
                <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-widest animate-pulse mb-1">
                  ANALYZING... {scanProgress}%
                </span>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-cyan-500/40">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              hoveredEntity.actionPrompt && (
                <button
                  onClick={startScan}
                  className="mt-2 pointer-events-auto px-3 py-1 bg-cyan-500/25 hover:bg-cyan-500/45 border border-cyan-400 rounded text-[10px] text-cyan-200 font-bold tracking-wider uppercase transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                >
                  {hoveredEntity.actionPrompt}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Bottom Corner: Sleek Collapsible Controls Helper (Desktop only) */}
      {hudVisible && (
        <div className="hidden md:flex fixed left-4 bottom-4 z-20 pointer-events-auto">
          {controlsOpen ? (
            <div className="flex items-center gap-2 bg-[#080d1a]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/25 text-[11px] text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">W/S</kbd>
                <span className="text-[10px] text-slate-400">Fly</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">A/D</kbd>
                <span className="text-[10px] text-slate-400">Steer</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 text-[10px] font-bold">Shift</kbd>
                <span className="text-[10px] text-slate-400">Boost</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-rose-300 text-[10px] font-bold">Space</kbd>
                <span className="text-[10px] text-slate-400">Brake</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">V</kbd>
                <span className="text-[10px] text-slate-400">Cam</span>
              </div>
              <button
                onClick={() => setControlsOpen(false)}
                title="Minimize Flight Hints"
                className="ml-1 p-0.5 text-slate-500 hover:text-cyan-300 transition cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setControlsOpen(true)}
              title="Show Flight Controls"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080d1a]/80 hover:bg-[#0c1527]/90 backdrop-blur-md border border-cyan-500/25 text-slate-400 hover:text-cyan-300 text-[10px] font-bold transition cursor-pointer shadow-md"
            >
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>CONTROLS</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
