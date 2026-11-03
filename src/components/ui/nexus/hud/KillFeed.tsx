import React, { useEffect } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { Crosshair, Zap, Sun } from 'lucide-react';

export const KillFeed: React.FC = () => {
  const killFeed = useMultiplayerStore(state => state.killFeed);
  const pruneKillFeed = useMultiplayerStore(state => state.pruneKillFeed);

  useEffect(() => {
    const interval = setInterval(() => {
      pruneKillFeed();
    }, 1000);
    return () => clearInterval(interval);
  }, [pruneKillFeed]);

  if (killFeed.length === 0) return null;

  const getWeaponIcon = (weapon: string) => {
    switch (weapon.toUpperCase()) {
      case 'LASER':
        return <Crosshair size={12} className="text-amber-400 shrink-0" />;
      case 'SOLAR_BEAM':
        return <Sun size={12} className="text-orange-400 shrink-0" />;
      default:
        return <Zap size={12} className="text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="absolute top-24 sm:top-28 right-3 sm:right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-none select-none">
      {killFeed.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/85 border border-red-500/40 backdrop-blur-md shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-in slide-in-from-right-4 duration-200"
        >
          <span className="text-[11px] font-black text-cyan-300 drop-shadow">
            {entry.attackerName}
          </span>
          <div className="flex items-center gap-1 bg-red-950/70 px-1.5 py-0.5 rounded border border-red-500/40">
            {getWeaponIcon(entry.weapon)}
            <span className="text-[9px] font-bold text-red-200 uppercase tracking-widest">
              {entry.weapon === 'SOLAR_BEAM' ? 'SOLAR' : entry.weapon}
            </span>
          </div>
          <span className="text-[11px] font-black text-red-400 drop-shadow">
            {entry.victimName}
          </span>
        </div>
      ))}
    </div>
  );
};
