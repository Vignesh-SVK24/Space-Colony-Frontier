import { useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Crosshair, HelpCircle, ChevronDown, AlertTriangle, Navigation } from 'lucide-react';

export const CenterTargetingHUD: FC = () => {
  const {
    hoveredEntity,
    isScanning,
    scanProgress,
    startScan,
    hudVisible,
    flightSpeed,
    verticalSpeed,
    altitude,
    heading,
    pitch,
    roll,
    flightWarnings,
    activeWaypoint,
    distanceToWaypoint,
    isBoosting,
    isBraking,
    weatherEvent
  } = useNexusGameStore();

  const [controlsOpen, setControlsOpen] = useState(true);

  const isRapidDescent = verticalSpeed < -10;
  const isDangerousDescent = verticalSpeed < -15;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between items-center p-4 sm:p-6 font-mono select-none">
      {/* Top Banner: Warnings, Weather, or Active Waypoint */}
      <div className="mt-8 flex flex-col items-center gap-2">
        {hudVisible && flightWarnings.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/90 backdrop-blur-md border border-rose-500/80 text-rose-200 text-xs shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-[11px] uppercase font-bold tracking-widest">
              CAUTION // {flightWarnings.join(' · ')}
            </span>
          </div>
        )}

        {hudVisible && weatherEvent !== 'CALM' && flightWarnings.length === 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/85 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs shadow-lg animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              SPACE WEATHER ADVISORY: {weatherEvent.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Active Waypoint Vector Header */}
        {hudVisible && activeWaypoint && distanceToWaypoint && (
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs shadow-xl">
            <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              WAYPOINT: <span className="text-white">{activeWaypoint.name}</span>
            </span>
            <div className="w-px h-3 bg-slate-700" />
            <span className="text-[10px] text-cyan-300 font-bold">
              DIST: {distanceToWaypoint.total >= 10 ? (distanceToWaypoint.total * 0.1).toFixed(1) + ' KM' : Math.round(distanceToWaypoint.total * 10) + ' M'}
            </span>
            <span className="text-[9px] text-slate-400 font-bold">
              ALT Δ: {(distanceToWaypoint.vertical >= 0 ? '+' : '') + Math.round(distanceToWaypoint.vertical * 10) + ' M'}
            </span>
          </div>
        )}
      </div>

      {/* Center Holographic Reticle & Artificial Horizon */}
      <div className="relative flex items-center justify-center">
        {/* Left Telemetry: Digital Speedometer & Vertical Speed */}
        {hudVisible && (
          <div className="absolute right-24 flex items-center gap-2.5 pr-3 py-1 text-right">
            <div className="flex flex-col items-end space-y-1">
              {/* Forward Speed */}
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-base sm:text-xl font-black tracking-wider transition-colors duration-150 ${
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
                {isBoosting ? 'BOOST' : isBraking ? 'AIRBRAKE' : 'FORWARD'}
              </span>

              {/* Vertical Speed (V/S) */}
              <div className="pt-1 border-t border-slate-800 flex items-baseline gap-1">
                <span className="text-[8px] text-slate-400 font-bold">V/S</span>
                <span
                  className={`text-xs font-bold ${
                    isDangerousDescent
                      ? 'text-rose-400 animate-pulse'
                      : isRapidDescent
                      ? 'text-amber-400'
                      : 'text-cyan-300'
                  }`}
                >
                  {(verticalSpeed >= 0 ? '+' : '') + verticalSpeed.toFixed(1)}
                </span>
                <span className="text-[8px] text-slate-500">M/S</span>
              </div>
            </div>

            {/* Vertical Speed Bar Gauge */}
            <div className="w-1.5 h-16 rounded-full bg-slate-900 border border-cyan-500/20 overflow-hidden flex flex-col justify-center relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700" />
              <div
                className={`w-full transition-all duration-100 ${
                  verticalSpeed >= 0 ? 'bg-cyan-400' : isDangerousDescent ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{
                  height: `${Math.min(50, Math.abs(verticalSpeed) * 1.6)}%`,
                  transform: verticalSpeed >= 0 ? 'translateY(-50%)' : 'translateY(50%)'
                }}
              />
            </div>
          </div>
        )}

        {/* Right Telemetry: True Altitude & Heading */}
        {hudVisible && (
          <div className="absolute left-24 flex items-center gap-2.5 pl-3 py-1 text-left">
            <div className="w-1.5 h-16 rounded-full bg-slate-900 border border-cyan-500/20 overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-cyan-400 transition-all duration-100"
                style={{ height: `${Math.min(100, Math.max(5, (altitude / 60) * 100))}%` }}
              />
            </div>

            <div className="flex flex-col items-start space-y-1">
              {/* Clearance Altitude */}
              <div className="flex items-baseline gap-1">
                <span className="text-xs sm:text-sm text-cyan-300 font-bold tracking-wider">
                  ALT {altitude >= 10 ? (altitude * 0.1).toFixed(1) + ' KM' : Math.round(altitude * 10) + ' M'}
                </span>
              </div>
              <span className="text-[8px] font-bold text-slate-400 tracking-wider">
                CLEARANCE AGL
              </span>

              {/* Heading & Pitch */}
              <div className="pt-1 border-t border-slate-800 flex items-center gap-2 text-[9px] font-mono text-slate-300">
                <span>HDG <b className="text-cyan-400">{heading}°</b></span>
                <span>PITCH <b className="text-cyan-400">{(pitch >= 0 ? '+' : '') + pitch}°</b></span>
              </div>
            </div>
          </div>
        )}

        {/* Artificial Horizon & Center Reticle */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Rotating Horizon Ladder with Pitch & Roll */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-75 ease-out"
            style={{
              transform: `rotate(${-roll}deg)`
            }}
          >
            {/* Horizon Line */}
            <div
              className="w-24 h-px bg-cyan-400/30 transition-transform duration-75 ease-out flex items-center justify-between"
              style={{ transform: `translateY(${-pitch * 0.8}px)` }}
            >
              <div className="w-4 h-1 border-t-2 border-cyan-400/50" />
              <div className="w-4 h-1 border-t-2 border-cyan-400/50" />
            </div>

            {/* Pitch +10 Ladder */}
            <div
              className="absolute w-12 h-px bg-cyan-400/20 border-dashed transition-transform duration-75"
              style={{ transform: `translateY(${-pitch * 0.8 - 14}px)` }}
            />
            {/* Pitch -10 Ladder */}
            <div
              className="absolute w-12 h-px bg-cyan-400/20 border-dashed transition-transform duration-75"
              style={{ transform: `translateY(${-pitch * 0.8 + 14}px)` }}
            />
          </div>

          {/* Central Aircraft Fixed Reticle */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            {/* Outer Circular Ring */}
            <div
              className={`absolute inset-0 rounded-full border transition-all duration-200 ${
                hoveredEntity ? 'border-cyan-400 scale-110 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'border-cyan-500/25'
              }`}
            />

            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/70" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/70" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/70" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/70" />

            {/* Center Pip */}
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

          {/* Hover Target Readout Card */}
          {hoveredEntity && (
            <div className="absolute top-28 flex flex-col items-center bg-[#080d1a]/95 backdrop-blur-md px-3.5 py-2 rounded-md border border-cyan-400/50 text-center shadow-[0_4px_24px_rgba(0,0,0,0.8)] animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold text-cyan-200 tracking-wider uppercase">
                  {hoveredEntity.name}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {hoveredEntity.distanceM}M
                </span>
              </div>

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
      </div>

      {/* Bottom Corner: 6-DOF Flight Controls Helper */}
      {hudVisible && (
        <div className="hidden md:flex fixed left-4 bottom-4 z-20 pointer-events-auto">
          {controlsOpen ? (
            <div className="flex items-center gap-2 bg-[#080d1a]/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-cyan-500/30 text-[11px] text-slate-300 shadow-2xl">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">W/S</kbd>
                <span className="text-[10px] text-slate-400">Throttle</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">A/D</kbd>
                <span className="text-[10px] text-slate-400">Yaw</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">SPACE</kbd>
                <span className="text-[10px] text-slate-400">Ascend</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">Z</kbd>
                <span className="text-[10px] text-slate-400">Descend</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 text-[10px] font-bold">SHIFT</kbd>
                <span className="text-[10px] text-slate-400">Boost</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold">M</kbd>
                <span className="text-[10px] text-slate-400">Map</span>
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
              title="Show 6-DOF Flight Controls"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080d1a]/85 hover:bg-[#0c1527]/95 backdrop-blur-md border border-cyan-500/30 text-slate-400 hover:text-cyan-300 text-[10px] font-bold transition cursor-pointer shadow-lg"
            >
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>6-DOF CONTROLS</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
