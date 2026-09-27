import React, { useState, useEffect } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { Shield, Crosshair, Activity, Radio, Cpu, X, Compass, Zap } from 'lucide-react';

export const CombatDebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    isSolo,
    roomCode,
    selfState,
    opponentState,
    lastAppliedServerTick,
    connectionQuality,
    showCombatHitboxes,
    showCombatTrajectories,
    showCombatAimVector,
    combatTelemetryLog,
    toggleCombatHitboxes,
    toggleCombatTrajectories,
    toggleCombatAimVector,
    laserCooldownRemaining,
    bulletCooldownRemaining
  } = useMultiplayerStore();

  // F3 keyboard shortcut to toggle combat debug overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDistance = () => {
    if (!selfState || !opponentState) return '---';
    const dx = selfState.position[0] - opponentState.position[0];
    const dy = selfState.position[1] - opponentState.position[1];
    const dz = selfState.position[2] - opponentState.position[2];
    return Math.floor(Math.sqrt(dx * dx + dy * dy + dz * dz)) + 'm';
  };

  return (
    <>
      {/* Floating HUD toggle button */}
      <div className="absolute top-14 left-3 sm:left-4 z-40 pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer backdrop-blur-md border ${
            isOpen
              ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-black/60 border-gray-700/60 text-gray-400 hover:text-amber-300 hover:border-amber-500/50'
          }`}
          title="Toggle Combat Debug Inspector (or press F3)"
        >
          <Activity size={12} className={isOpen ? 'text-amber-400 animate-spin' : 'text-gray-400'} />
          <span>F3 COMBAT DEBUG</span>
        </button>
      </div>

      {/* Main Debug Window */}
      {isOpen && (
        <div className="absolute top-24 left-3 sm:left-4 z-40 w-80 sm:w-96 max-h-[80vh] overflow-y-auto pointer-events-auto bg-black/90 border border-amber-500/50 rounded-xl p-3.5 font-mono text-white text-xs shadow-2xl backdrop-blur-lg">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-amber-400" />
              <span className="font-bold text-amber-400 tracking-wider">COMBAT HIT & HP INSPECTOR</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Real-time Telemetry Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-950/70 p-2 rounded-lg border border-gray-800/80 text-[11px]">
            <div>
              <span className="text-gray-500">Mode: </span>
              <span className="text-cyan-300 font-bold">{isSolo ? 'SOLO (AI)' : `ROOM: ${roomCode}`}</span>
            </div>
            <div>
              <span className="text-gray-500">Server Tick: </span>
              <span className="text-emerald-400 font-bold">#{lastAppliedServerTick}</span>
            </div>
            <div>
              <span className="text-gray-500">Target Range: </span>
              <span className="text-yellow-300 font-bold">{getDistance()}</span>
            </div>
            <div>
              <span className="text-gray-500">Network: </span>
              <span className={connectionQuality === 'good' ? 'text-emerald-400' : 'text-yellow-400'}>
                {connectionQuality.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Player HP: </span>
              <span className="text-cyan-400 font-bold">{selfState?.hp ?? 100} / 100</span>
            </div>
            <div>
              <span className="text-gray-500">Opponent HP: </span>
              <span className="text-red-400 font-bold">{opponentState?.hp ?? 100} / 100</span>
            </div>
            <div>
              <span className="text-gray-500">Bullet CD: </span>
              <span className={bulletCooldownRemaining <= 0.05 ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                {bulletCooldownRemaining <= 0.05 ? 'READY' : `${bulletCooldownRemaining.toFixed(1)}s`}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Laser CD: </span>
              <span className={laserCooldownRemaining <= 0.05 ? 'text-amber-400 font-bold' : 'text-gray-400'}>
                {laserCooldownRemaining <= 0.05 ? 'READY' : `${laserCooldownRemaining.toFixed(1)}s`}
              </span>
            </div>
          </div>

          {/* Visual Debug Toggles */}
          <div className="space-y-1.5 mb-3 bg-gray-950/70 p-2.5 rounded-lg border border-gray-800/80 text-[11px]">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Visual Layers</div>
            <label className="flex items-center justify-between cursor-pointer text-gray-300 hover:text-white">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-amber-400" />
                <span>Wireframe Hitboxes (r = 4.8m)</span>
              </div>
              <input
                type="checkbox"
                checked={showCombatHitboxes}
                onChange={toggleCombatHitboxes}
                className="cursor-pointer accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-gray-300 hover:text-white">
              <div className="flex items-center gap-1.5">
                <Compass size={12} className="text-sky-400" />
                <span>Aim Trajectories</span>
              </div>
              <input
                type="checkbox"
                checked={showCombatTrajectories}
                onChange={toggleCombatTrajectories}
                className="cursor-pointer accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-gray-300 hover:text-white">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-yellow-400" />
                <span>Weapon Origin Vectors</span>
              </div>
              <input
                type="checkbox"
                checked={showCombatAimVector}
                onChange={toggleCombatAimVector}
                className="cursor-pointer accent-yellow-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-gray-300 hover:text-white">
              <div className="flex items-center gap-1.5">
                <Crosshair size={12} className="text-cyan-400" />
                <span>Center Crosshair Convergence</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
            </label>

            <label className="flex items-center justify-between cursor-pointer text-gray-300 hover:text-white">
              <div className="flex items-center gap-1.5">
                <Radio size={12} className="text-emerald-400" />
                <span>Swept Continuous Collision</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">ACTIVE (145 m/s)</span>
            </label>
          </div>

          {/* Authoritative Damage Rules Spec */}
          <div className="mb-3 p-2 bg-gray-950/70 rounded-lg border border-gray-800/80 text-[10px] text-gray-400 space-y-0.5">
            <div className="text-amber-400 font-bold">AUTHORITATIVE DAMAGE SPEC</div>
            <div>• Bullet: <span className="text-white font-bold">10 HP</span> (Speed: 145m/s, CD: 0.45s)</div>
            <div>• Laser Beam: <span className="text-white font-bold">20 HP</span> (Range: 220m, CD: 5.0s)</div>
            <div>• Ship Collision: <span className="text-white font-bold">15 HP</span> (Impulse resolution)</div>
            <div>• Deduplication: <span className="text-emerald-400 font-bold">Unique attackId per event</span></div>
          </div>

          {/* Telemetry Log */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Cpu size={11} className="text-sky-400" />
                <span>Authoritative Hit Telemetry</span>
              </div>
              <span className="text-[10px] text-gray-500">{combatTelemetryLog.length} events</span>
            </div>

            {combatTelemetryLog.length === 0 ? (
              <div className="text-center py-4 text-gray-600 text-[11px] bg-black/40 rounded border border-gray-900">
                No damage registered yet. Fire at the opponent!
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto text-[10px]">
                {combatTelemetryLog.map(entry => (
                  <div
                    key={entry.id}
                    className="p-1.5 bg-black/60 rounded border border-gray-800 flex flex-col gap-0.5"
                  >
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="font-bold text-amber-300 uppercase">
                        [{entry.weapon}] -{entry.damage} HP
                      </span>
                      <span className="text-gray-500">Tick #{entry.serverTick}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400">
                      <span>HP Left: <strong className="text-white">{entry.remainingHp}</strong></span>
                      <span className="truncate max-w-[130px] text-gray-500" title={entry.attackId}>
                        {entry.attackId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
