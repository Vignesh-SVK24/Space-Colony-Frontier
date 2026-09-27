import React, { useEffect } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { disconnect } from '../../../../multiplayer/socketClient';
import { LogOut, Bot, Wifi, Map as MapIcon, Crosshair, Zap, Maximize, Minimize } from 'lucide-react';
import { FullScreenTacticalMap } from './FullScreenTacticalMap';
import { CombatDebugOverlay } from './CombatDebugOverlay';
import { nexusAudio } from '../../../../utils/nexusAudio';
import { COMBAT_CONFIG } from '../../../../config/combatConfig';
import { enterFullscreen, toggleFullscreen, useFullscreen } from '../../../../utils/fullscreenHelper';

export const BattleHUD: React.FC = () => {
  const {
    roomCode,
    selfState,
    opponentState,
    connectionQuality,
    isSolo,
    reset,
    isMapOpen,
    setMapOpen,
    laserCooldownRemaining,
    bulletCooldownRemaining,
    targetLock,
    hitConfirmActive,
    countdown,
    roomStatus
  } = useMultiplayerStore();

  const { isFullscreen } = useFullscreen();

  // Attempt to enter fullscreen on battle start to hide address bar
  useEffect(() => {
    enterFullscreen();
  }, []);

  // 'M' Key shortcut for opening/closing map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat) {
        e.preventDefault();
        setMapOpen(!isMapOpen);
        nexusAudio.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapOpen, setMapOpen]);

  const getHpColor = (hp: number) => {
    if (hp > 60) return 'bg-emerald-500';
    if (hp > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'good': return 'text-emerald-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-500';
    }
  };
  
  const getDistance = () => {
    if (!selfState || !opponentState) return 0;
    const dx = selfState.position[0] - opponentState.position[0];
    const dy = selfState.position[1] - opponentState.position[1];
    const dz = selfState.position[2] - opponentState.position[2];
    return Math.floor(Math.sqrt(dx*dx + dy*dy + dz*dz));
  };

  const handleExit = () => {
    if (!isSolo) disconnect();
    reset();
  };

  // Laser recharge progress (0% when 5.0s, 100% when 0s)
  const laserReady = laserCooldownRemaining <= 0.05;
  const laserProgress = Math.max(0, Math.min(100, ((COMBAT_CONFIG.LASER_COOLDOWN - laserCooldownRemaining) / COMBAT_CONFIG.LASER_COOLDOWN) * 100));

  return (
    <>
      <div className="absolute inset-0 pointer-events-none font-mono text-white select-none overflow-hidden">
        
        {/* Top Left: Exit Match & Fullscreen Toggle & Controls Guide */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-30 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExit}
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-red-950/80 border border-gray-700/60 hover:border-red-500/50 text-[11px] text-gray-300 hover:text-red-300 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
              title="Return to Menu"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">Exit Match</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-sky-950/80 border border-gray-700/60 hover:border-sky-500/50 text-[11px] text-gray-300 hover:text-sky-300 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Hide browser address bar)'}
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">
                {isFullscreen ? 'Window' : 'Fullscreen'}
              </span>
            </button>
          </div>

          {/* Quick Desktop Flight Key Reference */}
          <div className="hidden lg:flex flex-col gap-1 p-2 bg-black/60 border border-gray-800/80 rounded-lg text-[10px] text-gray-400 backdrop-blur-md">
            <div><span className="text-cyan-400 font-bold">W/S/A/D:</span> Thrust & Yaw</div>
            <div><span className="text-cyan-400 font-bold">SPACE/C:</span> Ascend/Descend</div>
            <div><span className="text-cyan-400 font-bold">L-CLICK / J:</span> Plasma Blaster</div>
            <div><span className="text-amber-400 font-bold">R-CLICK / K:</span> Laser Beam (5s)</div>
            <div><span className="text-sky-300 font-bold">M:</span> Full Tactical Map</div>
          </div>
        </div>

        {/* Top Center: Match Header & Mode */}
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
          <div className="text-[10px] sm:text-xs text-cyan-300 bg-black/80 px-3.5 py-1 rounded-full border border-cyan-500/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
            {isSolo ? (
              <>
                <Bot size={13} className="text-emerald-400" />
                <span className="font-bold tracking-widest text-emerald-300">SOLO PRACTICE (AI COMBAT)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold tracking-widest">ROOM: {roomCode}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Tactical Targeting Reticle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 pointer-events-none opacity-85">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-3 sm:h-3.5 bg-cyan-400/80" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-3 sm:h-3.5 bg-cyan-400/80" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 sm:w-3.5 h-[2px] bg-cyan-400/80" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 sm:w-3.5 h-[2px] bg-cyan-400/80" />
          <div className="absolute inset-2 rounded-full border border-cyan-400/40" />
          
          {/* Target Lock Ring */}
          {targetLock && (
            <div className="absolute -inset-2 rounded-full border-2 border-red-500/80 animate-ping" />
          )}

          {/* Hit Confirmation Marker */}
          {hitConfirmActive && (
            <div className="absolute inset-0 flex items-center justify-center animate-out fade-out duration-250">
              <div className="absolute w-3.5 h-0.5 bg-red-400 rotate-45 translate-x-2.5 -translate-y-2.5 shadow-[0_0_8px_rgba(239,68,68,1)]" />
              <div className="absolute w-3.5 h-0.5 bg-red-400 -rotate-45 -translate-x-2.5 -translate-y-2.5 shadow-[0_0_8px_rgba(239,68,68,1)]" />
              <div className="absolute w-3.5 h-0.5 bg-red-400 -rotate-45 translate-x-2.5 translate-y-2.5 shadow-[0_0_8px_rgba(239,68,68,1)]" />
              <div className="absolute w-3.5 h-0.5 bg-red-400 rotate-45 -translate-x-2.5 translate-y-2.5 shadow-[0_0_8px_rgba(239,68,68,1)]" />
              <span className="absolute -bottom-5 text-[9px] font-black text-red-300 tracking-widest uppercase">HIT</span>
            </div>
          )}
        </div>

        {/* Match Countdown Banner */}
        {((countdown !== null && countdown > 0) || roomStatus === 'COUNTDOWN') && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center animate-pulse">
            <div className="text-5xl sm:text-7xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
              {countdown ?? 3}
            </div>
            <div className="text-xs sm:text-sm font-bold tracking-widest text-amber-200 uppercase mt-2 bg-black/75 px-4 py-1 rounded-full border border-amber-500/50 backdrop-blur-md">
              ENGAGEMENT INITIATION
            </div>
          </div>
        )}

        {/* Target Lock Card (If opponent in sights) */}
        {targetLock && (
          <div className="absolute top-[58%] left-1/2 -translate-x-1/2 bg-red-950/70 border border-red-500/80 px-3 py-1.5 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.4)] z-20">
            <Crosshair size={14} className="text-red-400 animate-spin-slow" />
            <div className="text-[11px] font-bold text-red-200">
              TARGET LOCKED: <span className="text-white">{targetLock.name}</span>
            </div>
            <div className="text-[10px] bg-red-900/80 px-1.5 py-0.5 rounded text-red-300 font-bold">
              {targetLock.distance}M
            </div>
          </div>
        )}

        {/* Top Right: Opponent Status */}
        {opponentState && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col items-end gap-1 z-20">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-400 drop-shadow">
              {isSolo && <Bot size={14} className="text-red-400" />}
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{opponentState.name}</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-300 font-semibold bg-black/60 px-2 py-0.5 rounded border border-gray-800">
              RANGE: {getDistance()}M
            </div>
            <div className="w-[140px] sm:w-[220px] h-[10px] sm:h-[12px] bg-black/80 border border-red-500/50 rounded-xs overflow-hidden relative shadow-lg">
              <div 
                className="h-full transition-all duration-300 bg-gradient-to-r from-red-600 to-rose-500"
                style={{ width: `${Math.max(0, Math.min(100, opponentState.hp))}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Center: Player Hull HP Gauge */}
        {selfState && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20">
            <div className="text-xs sm:text-sm font-bold tracking-wider text-sky-200 drop-shadow">
              {selfState.name}
            </div>
            <div className="w-[220px] sm:w-[340px] h-[20px] sm:h-[24px] bg-black/85 border border-sky-500/50 rounded-sm relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(2,132,199,0.35)]">
              <div 
                className={`h-full transition-all duration-300 ${getHpColor(selfState.hp)}`}
                style={{ width: `${Math.max(0, Math.min(100, selfState.hp))}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-black drop-shadow text-white tracking-wider">
                HULL: {Math.max(0, Math.floor(selfState.hp))} / 100
              </div>
            </div>

            {/* Tactical Map Button (Desktop Only) */}
            <button
              onClick={() => {
                setMapOpen(true);
                nexusAudio.playClick();
              }}
              className="hidden lg:flex pointer-events-auto mt-1 items-center gap-1.5 px-3 py-1 rounded bg-black/70 hover:bg-cyan-950 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer backdrop-blur-md"
            >
              <MapIcon size={14} className="text-cyan-400" />
              <span>TACTICAL MAP (M)</span>
            </button>
          </div>
        )}

        {/* Bottom Right: Dual Weapon Systems Deck (Desktop Only - Mobile has dedicated touch buttons) */}
        <div className="hidden lg:flex absolute bottom-4 sm:bottom-6 right-3 sm:right-6 items-end gap-3 z-20 pointer-events-auto">
          
          {/* Primary Weapon: Plasma Bullets */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center backdrop-blur-md transition-all ${
              bulletCooldownRemaining <= 0.05
                ? 'bg-black/75 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-black/60 border-gray-700 text-gray-500'
            }`}>
              <Zap size={16} className={bulletCooldownRemaining <= 0.05 ? 'text-cyan-400 animate-pulse' : 'text-gray-500'} />
              <span className="text-[8.5px] font-bold mt-0.5">0.45s</span>
            </div>
            <div className="text-[9px] text-gray-300 font-bold tracking-wider">BLASTERS</div>
          </div>

          {/* Secondary Weapon: 5.0s Laser Beam Recharge Gauge */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-14 rounded-xl border border-amber-500/60 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {/* Circular Recharge Indicator */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.2)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={laserReady ? '#f59e0b' : '#38bdf8'}
                  strokeWidth="3.2"
                  strokeDasharray={`${laserProgress}, 100`}
                />
              </svg>

              {laserReady ? (
                <div className="flex flex-col items-center z-10">
                  <Crosshair size={18} className="text-amber-400 animate-spin-slow" />
                  <span className="text-[8.5px] font-black text-amber-300 tracking-wider">READY</span>
                </div>
              ) : (
                <div className="flex flex-col items-center z-10 text-[10px] font-black text-sky-300">
                  <span>{laserCooldownRemaining.toFixed(1)}s</span>
                  <span className="text-[7px] text-gray-400 font-normal">CHARGING</span>
                </div>
              )}
            </div>
            <div className="text-[9px] text-amber-300 font-bold tracking-wider">LASER BEAM</div>
          </div>

        </div>

        {/* Bottom Left: Connectivity / Mode Badge */}
        <div className="absolute bottom-4 sm:bottom-6 left-3 sm:left-6 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-lg border border-gray-800 backdrop-blur-md z-20">
          {isSolo ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OFFLINE PRACTICE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Wifi size={13} className={getConnectionColor()} />
              <span className={`text-[11px] font-semibold uppercase ${getConnectionColor()}`}>
                {connectionQuality}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Combat Debug Inspector (F3) */}
      <CombatDebugOverlay />

      {/* Full-Screen Tactical Map Modal */}
      <FullScreenTacticalMap />
    </>
  );
};
