import React from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';

export const BattleHUD: React.FC = () => {
  const { roomCode, selfState, opponentState, connectionQuality } = useMultiplayerStore();

  const getHpColor = (hp: number) => {
    if (hp > 60) return 'bg-green-500';
    if (hp > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConnectionColor = () => {
    switch(connectionQuality) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
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

  return (
    <div className="absolute inset-0 pointer-events-none font-mono text-white select-none">
      {/* Top Center: Room Code & Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="text-xs text-cyan-400 bg-black/50 px-2 py-1 rounded border border-cyan-900/50">
          ROOM: {roomCode}
        </div>
      </div>

      {/* Center: Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-white/50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-white/50" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-[2px] bg-white/50" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-[2px] bg-white/50" />
      </div>

      {/* Bottom Center: Own HP */}
      {selfState && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="text-sm font-bold tracking-wider">{selfState.name}</div>
          <div className="w-[300px] h-[20px] bg-black/50 border border-white/20 relative">
            <div 
              className={`h-full transition-all duration-300 ${getHpColor(selfState.hp)}`}
              style={{ width: `${Math.max(0, Math.min(100, selfState.hp))}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold drop-shadow-md">
              {Math.max(0, Math.floor(selfState.hp))} / 100
            </div>
          </div>
        </div>
      )}

      {/* Top Right: Opponent HP */}
      {opponentState && (
        <div className="absolute top-8 right-8 flex flex-col items-end gap-1">
          <div className="text-sm font-bold text-red-400">{opponentState.name}</div>
          <div className="text-xs text-gray-300 mb-1">DIST: {getDistance()}m</div>
          <div className="w-[200px] h-[12px] bg-black/50 border border-red-500/30 relative">
            <div 
              className="h-full transition-all duration-300 bg-red-500"
              style={{ width: `${Math.max(0, Math.min(100, opponentState.hp))}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Right: Weapon Cooldown (Dummy for now) */}
      <div className="absolute bottom-8 right-8 flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20" />
        </div>
        <div className="text-xs text-cyan-400">WEAPON</div>
      </div>

      {/* Bottom Left: Connection Quality */}
      <div className="absolute bottom-8 left-8 flex items-center gap-2">
        <div className={`text-xs ${getConnectionColor()}`}>
          CONN
        </div>
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full ${connectionQuality === 'poor' ? 'bg-red-500' : connectionQuality === 'fair' ? 'bg-yellow-500' : connectionQuality === 'good' ? 'bg-green-500' : 'bg-gray-600'}`} />
          <div className={`w-2 h-2 rounded-full ${connectionQuality === 'fair' ? 'bg-yellow-500' : connectionQuality === 'good' ? 'bg-green-500' : 'bg-gray-600'}`} />
          <div className={`w-2 h-2 rounded-full ${connectionQuality === 'good' ? 'bg-green-500' : 'bg-gray-600'}`} />
        </div>
      </div>
    </div>
  );
};
