import React, { useEffect } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { disconnect, sendReload } from '../../../../multiplayer/colyseusClient';
import { LogOut, Bot, Wifi, Map as MapIcon, Crosshair, Zap, Maximize, Minimize, Sun, Shield } from 'lucide-react';
import { FullScreenTacticalMap } from './FullScreenTacticalMap';
import { CombatDebugOverlay } from './CombatDebugOverlay';
import { nexusAudio } from '../../../../utils/nexusAudio';
import { COMBAT_CONFIG } from '../../../../config/combatConfig';
import { enterFullscreen, toggleFullscreen, useFullscreen } from '../../../../utils/fullscreenHelper';

export const BattleHUD: React.FC = () => {
  const roomCode = useMultiplayerStore(state => state.roomCode);
  const selfState = useMultiplayerStore(state => state.selfState);
  const opponentState = useMultiplayerStore(state => state.opponentState);
  const otherPlayers = useMultiplayerStore(state => state.otherPlayers);
  const connectionQuality = useMultiplayerStore(state => state.connectionQuality);
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const gameMode = useMultiplayerStore(state => state.gameMode);
  const reset = useMultiplayerStore(state => state.reset);
  const isMapOpen = useMultiplayerStore(state => state.isMapOpen);
  const setMapOpen = useMultiplayerStore(state => state.setMapOpen);
  const ammo = useMultiplayerStore(state => state.ammo);
  const isReloading = useMultiplayerStore(state => state.isReloading);
  const reloadTimeRemaining = useMultiplayerStore(state => state.reloadTimeRemaining);
  const laserCooldownRemaining = useMultiplayerStore(state => state.laserCooldownRemaining);
  const solarCooldownRemaining = useMultiplayerStore(state => state.solarCooldownRemaining);
  const targetLock = useMultiplayerStore(state => state.targetLock);
  const hitConfirmActive = useMultiplayerStore(state => state.hitConfirmActive);
  const countdown = useMultiplayerStore(state => state.countdown);
  const roomStatus = useMultiplayerStore(state => state.roomStatus);

  const opponentList = otherPlayers.length > 0 ? otherPlayers : (opponentState ? [opponentState] : []);
  const { isFullscreen } = useFullscreen();

  // Fullscreen is user-controlled via HUD toggle to avoid repetitive browser pop-up alerts

  // 'M' Key shortcut for map, 'R' key for reload
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat) {
        e.preventDefault();
        setMapOpen(!isMapOpen);
        nexusAudio.playClick();
      }
      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault();
        if (!isSolo) {
          sendReload();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapOpen, setMapOpen, isSolo]);

  const getHpColor = (hp: number) => {
    if (hp > 150) return 'bg-emerald-500';
    if (hp > 75) return 'bg-yellow-500';
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

  const handleExit = () => {
    if (!isSolo) disconnect();
    reset();
  };

  const laserReady = laserCooldownRemaining <= 0.05;
  const laserProgress = Math.max(0, Math.min(100, ((COMBAT_CONFIG.LASER_COOLDOWN - laserCooldownRemaining) / COMBAT_CONFIG.LASER_COOLDOWN) * 100));

  const solarReady = solarCooldownRemaining <= 0.05;
  const solarProgress = Math.max(0, Math.min(100, ((COMBAT_CONFIG.SOLAR_COOLDOWN - solarCooldownRemaining) / COMBAT_CONFIG.SOLAR_COOLDOWN) * 100));

  return (
    <>
      <div className="absolute inset-0 pointer-events-none font-mono text-white select-none overflow-hidden">
        
        {/* Top Left: Exit Match & Controls Guide */}
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
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">
                {isFullscreen ? 'Window' : 'Fullscreen'}
              </span>
            </button>
          </div>

          {/* Flight & Combat Keys */}
          <div className="hidden lg:flex flex-col gap-1 p-2 bg-black/60 border border-gray-800/80 rounded-lg text-[10px] text-gray-400 backdrop-blur-md">
            <div><span className="text-cyan-400 font-bold">W/S/A/D:</span> Thrust & Yaw</div>
            <div><span className="text-cyan-400 font-bold">SPACE/C:</span> Ascend/Descend</div>
            <div><span className="text-cyan-400 font-bold">L-CLICK / J:</span> Bullet (2 HP · 30 Mag)</div>
            <div><span className="text-amber-400 font-bold">R-CLICK / K:</span> Laser Beam (12 HP · 3s)</div>
            <div><span className="text-orange-400 font-bold">L:</span> Solar Beam (30 HP · 10s)</div>
            <div><span className="text-sky-300 font-bold">R:</span> Reload Ammo (2.0s)</div>
            <div><span className="text-sky-300 font-bold">M:</span> Tactical Map</div>
          </div>
        </div>

        {/* Top Center: Match Header & Mode */}
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
          <div className="text-[10px] sm:text-xs text-cyan-300 bg-black/80 px-3.5 py-1 rounded-full border border-cyan-500/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
            {isSolo ? (
              <>
                <Bot size={13} className="text-emerald-400" />
                <span className="font-bold tracking-widest text-emerald-300">SOLO PRACTICE (250 HP)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold tracking-widest">
                  ROOM: {roomCode} · {gameMode === '2v2' ? '2v2 TEAM BATTLE' : gameMode === 'FFA' ? '4-PLAYER FFA' : '1v1 DUEL'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center: Targeting Reticle & Hit Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 pointer-events-none opacity-85">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-3 sm:h-3.5 bg-cyan-400/80" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-3 sm:h-3.5 bg-cyan-400/80" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 sm:w-3.5 h-[2px] bg-cyan-400/80" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 sm:w-3.5 h-[2px] bg-cyan-400/80" />
          <div className="absolute inset-2 rounded-full border border-cyan-400/40" />
          
          {targetLock && (
            <div className="absolute -inset-2 rounded-full border-2 border-red-500/80 animate-ping" />
          )}

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

        {/* Match Countdown */}
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

        {/* Target Lock Card */}
        {targetLock && (
          <div className="absolute top-[58%] left-1/2 -translate-x-1/2 bg-red-950/70 border border-red-500/80 px-3 py-1.5 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.4)] z-20">
            <Crosshair size={14} className="text-red-400 animate-spin-slow" />
            <div className="text-[11px] font-bold text-red-200">
              TARGET: <span className="text-white">{targetLock.name}</span>
            </div>
            <div className="text-[10px] bg-red-900/80 px-1.5 py-0.5 rounded text-red-300 font-bold">
              {targetLock.distance}M · {Math.max(0, targetLock.hp)} HP
            </div>
          </div>
        )}

        {/* Top Right: Opponents Status Stack */}
        {opponentList.length > 0 && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col items-end gap-2 z-20">
            {opponentList.map((opp) => {
              const isLocked = targetLock?.id === opp.id;
              const dist = selfState ? Math.floor(
                Math.hypot(
                  selfState.position[0] - opp.position[0],
                  selfState.position[1] - opp.position[1],
                  selfState.position[2] - opp.position[2]
                )
              ) : 0;
              const isEliminated = !opp.alive || opp.hp <= 0;
              const isFriendly = gameMode === '2v2' && selfState && selfState.team !== 'NONE' && selfState.team === opp.team;

              return (
                <div 
                  key={opp.id} 
                  className={`flex flex-col items-end gap-0.5 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                    isLocked 
                      ? 'bg-red-950/80 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                      : isFriendly
                      ? 'bg-emerald-950/60 border border-emerald-500/60'
                      : 'bg-black/60 border border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white drop-shadow">
                    {isFriendly ? <Shield size={12} className="text-emerald-400" /> : (isSolo ? <Bot size={12} className="text-red-400" /> : null)}
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{
                        backgroundColor: opp.color === 'yellow' ? '#eab308' : opp.color === 'blue' ? '#3b82f6' : opp.color === 'green' ? '#22c55e' : '#ef4444'
                      }} 
                    />
                    <span className="truncate max-w-[110px] sm:max-w-[160px]">
                      {opp.name} {opp.team !== 'NONE' ? `[Team ${opp.team}]` : ''}
                    </span>
                    {isEliminated && (
                      <span className="text-[9px] text-red-500 font-black uppercase">
                        [KIA]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[9px] text-gray-300 font-semibold">
                    <span>{dist}M</span>
                    <span>HP: {Math.max(0, Math.floor(opp.hp))} / 250</span>
                  </div>

                  <div className="w-[120px] sm:w-[160px] h-[6px] sm:h-[8px] bg-black/80 border border-red-500/40 rounded-xs overflow-hidden relative shadow">
                    <div 
                      className={`h-full transition-all duration-300 ${isEliminated ? 'bg-gray-700' : isFriendly ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-500'}`}
                      style={{ width: `${Math.max(0, Math.min(100, (opp.hp / 250) * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Center: Authoritative 250 HP Gauge */}
        {selfState && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20">
            <div className="text-xs sm:text-sm font-bold tracking-wider text-sky-200 drop-shadow">
              {selfState.name} {selfState.team !== 'NONE' ? `[TEAM ${selfState.team}]` : ''}
            </div>
            <div className="w-[240px] sm:w-[360px] h-[22px] sm:h-[26px] bg-black/85 border border-sky-500/50 rounded-sm relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(2,132,199,0.35)]">
              <div 
                className={`h-full transition-all duration-300 ${getHpColor(selfState.hp)}`}
                style={{ width: `${Math.max(0, Math.min(100, (selfState.hp / 250) * 100))}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-black drop-shadow text-white tracking-wider">
                HULL: {Math.max(0, Math.floor(selfState.hp))} / 250
              </div>
            </div>

            {/* Tactical Map Button */}
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

        {/* Bottom Right: 3 Weapons Systems Deck (Bullet, Laser, Solar Beam) */}
        <div className="hidden lg:flex absolute bottom-4 sm:bottom-6 right-3 sm:right-6 items-end gap-3 z-20 pointer-events-auto">
          
          {/* Weapon 1: Rapid Plasma Bullet (2 HP · 30 Magazine · 2s Reload) */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center backdrop-blur-md transition-all ${
              !isReloading && ammo > 0
                ? 'bg-black/75 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-black/80 border-red-500/70 text-red-400'
            }`}>
              <Zap size={16} className={!isReloading && ammo > 0 ? 'text-cyan-400 animate-pulse' : 'text-red-400'} />
              {isReloading ? (
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-red-300 animate-pulse">RELOAD</span>
                  <span className="text-[7.5px] text-gray-300">{reloadTimeRemaining.toFixed(1)}s</span>
                </div>
              ) : (
                <span className="text-[10px] font-black text-white">{ammo} / 30</span>
              )}
            </div>
            <div className="text-[9px] text-gray-300 font-bold tracking-wider">BULLET (2HP)</div>
          </div>

          {/* Weapon 2: Laser Beam (12 HP · 3.0s Recharge) */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-14 rounded-xl border border-amber-500/60 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.3)]">
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
            <div className="text-[9px] text-amber-300 font-bold tracking-wider">LASER (12HP)</div>
          </div>

          {/* Weapon 3: Special Solar Beam (30 HP · 10.0s Recharge) */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-14 rounded-xl border border-orange-500/70 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(249,115,22,0.35)]">
              <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(249, 115, 22, 0.2)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={solarReady ? '#f97316' : '#fbbf24'}
                  strokeWidth="3.2"
                  strokeDasharray={`${solarProgress}, 100`}
                />
              </svg>

              {solarReady ? (
                <div className="flex flex-col items-center z-10">
                  <Sun size={18} className="text-orange-400 animate-spin-slow" />
                  <span className="text-[8.5px] font-black text-orange-300 tracking-wider">READY</span>
                </div>
              ) : (
                <div className="flex flex-col items-center z-10 text-[10px] font-black text-orange-300">
                  <span>{solarCooldownRemaining.toFixed(1)}s</span>
                  <span className="text-[7px] text-gray-400 font-normal">CHARGING</span>
                </div>
              )}
            </div>
            <div className="text-[9px] text-orange-400 font-bold tracking-wider">SOLAR (30HP)</div>
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

      <CombatDebugOverlay />
      <FullScreenTacticalMap />
    </>
  );
};
