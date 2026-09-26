import React from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { disconnect } from '../../../../multiplayer/socketClient';
import { LogOut, Bot, Wifi } from 'lucide-react';

export const BattleHUD: React.FC = () => {
  const { roomCode, selfState, opponentState, connectionQuality, isSolo, reset } = useMultiplayerStore();

  const getHpColor = (hp: number) => {
    if (hp > 60) return 'bg-emerald-500';
    if (hp > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConnectionColor = () => {
    switch(connectionQuality) {
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

  return (
    <div className="absolute inset-0 pointer-events-none font-mono text-white select-none overflow-hidden">
      
      {/* Top Left: Exit Match Button */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-30">
        <button
          onClick={handleExit}
          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-red-950/80 border border-gray-700/60 hover:border-red-500/50 text-[11px] text-gray-300 hover:text-red-300 transition-colors cursor-pointer backdrop-blur-sm"
          title="Return to Menu"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline uppercase tracking-wider font-semibold">Exit</span>
        </button>
      </div>

      {/* Top Center: Mode Badge & Room Code */}
      <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
        <div className="text-[10px] sm:text-xs text-cyan-300 bg-black/70 px-3 py-1 rounded-full border border-cyan-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          {isSolo ? (
            <>
              <Bot size={13} className="text-emerald-400" />
              <span className="font-bold tracking-widest text-emerald-300">SOLO PRACTICE (AI MATCH)</span>
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 pointer-events-none opacity-80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-2.5 sm:h-3 bg-cyan-400/70" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-2.5 sm:h-3 bg-cyan-400/70" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2.5 sm:w-3 h-[2px] bg-cyan-400/70" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2.5 sm:w-3 h-[2px] bg-cyan-400/70" />
        <div className="absolute inset-1.5 rounded-full border border-cyan-400/30" />
      </div>

      {/* Top Right: Opponent HP HUD */}
      {opponentState && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col items-end gap-1 z-20">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-400 drop-shadow">
            {isSolo && <Bot size={14} className="text-red-400" />}
            <span className="truncate max-w-[130px] sm:max-w-[200px]">{opponentState.name}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-300 font-semibold bg-black/50 px-1.5 py-0.5 rounded">
            RANGE: {getDistance()}M
          </div>
          <div className="w-[140px] sm:w-[220px] h-[10px] sm:h-[12px] bg-black/70 border border-red-500/40 rounded-xs overflow-hidden relative">
            <div 
              className="h-full transition-all duration-300 bg-gradient-to-r from-red-600 to-rose-500"
              style={{ width: `${Math.max(0, Math.min(100, opponentState.hp))}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Center: Own Ship HP Gauge */}
      {selfState && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
          <div className="text-xs sm:text-sm font-bold tracking-wider text-sky-200 drop-shadow">
            {selfState.name}
          </div>
          <div className="w-[200px] sm:w-[320px] h-[18px] sm:h-[22px] bg-black/80 border border-sky-500/40 rounded-sm relative overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(2,132,199,0.3)]">
            <div 
              className={`h-full transition-all duration-300 ${getHpColor(selfState.hp)}`}
              style={{ width: `${Math.max(0, Math.min(100, selfState.hp))}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-black drop-shadow text-white">
              HULL: {Math.max(0, Math.floor(selfState.hp))} / 100
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right: Weapon Status Indicator */}
      <div className="absolute bottom-4 sm:bottom-6 right-3 sm:right-6 hidden sm:flex flex-col items-center gap-1 z-20">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-cyan-400/50 bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg">
          <div className="w-6 h-6 rounded-full bg-cyan-400/30 animate-pulse" />
        </div>
        <div className="text-[10px] text-cyan-300 font-bold tracking-wider">BLASTERS</div>
      </div>

      {/* Bottom Left: Connectivity / Mode Badge */}
      <div className="absolute bottom-4 sm:bottom-6 left-3 sm:left-6 flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded-lg border border-gray-800 backdrop-blur-sm z-20">
        {isSolo ? (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>OFFLINE SOLO</span>
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
  );
};
