import { useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const TacticalRadar3D: FC = () => {
  const { hudVisible, selectEntity, recordDiscovery } = useNexusGameStore();
  const [rangeKm, setRangeKm] = useState<50 | 150 | 300>(150);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!hudVisible) return null;

  // Radar contacts mapped relative to world coordinate scale
  const contacts = [
    { id: 'colony', name: 'OUTPOST ALPHA', type: 'colony', x: 0, y: 0, color: 'bg-cyan-400', ringColor: 'border-cyan-400' },
    { id: 'apex-station', name: 'APEX STATION', type: 'station', x: 0.35, y: -0.25, color: 'bg-cyan-300', ringColor: 'border-cyan-300' },
    { id: 'depot-beta', name: 'MINING DEPOT', type: 'station', x: -0.42, y: 0.38, color: 'bg-amber-400', ringColor: 'border-amber-400' },
    { id: 'selene-moon', name: 'MOON SELENE', type: 'moon', x: 0.65, y: 0.55, color: 'bg-slate-200', ringColor: 'border-slate-300' },
    { id: 'belt-alpha', name: 'IRON BELT', type: 'asteroid', x: 0.52, y: 0.1, color: 'bg-slate-400', ringColor: 'border-slate-500' },
    { id: 'cargo-701', name: 'CARGO-701', type: 'ship', x: 0.22, y: -0.15, color: 'bg-blue-400', ringColor: 'border-blue-400' },
    { id: 'miner-04', name: 'MINER-04', type: 'ship', x: -0.35, y: 0.22, color: 'bg-amber-300', ringColor: 'border-amber-300' },
    { id: 'ufo-valkyrie', name: 'UFO-X17', type: 'ufo', x: -0.72, y: -0.65, color: 'bg-purple-400', ringColor: 'border-purple-400' }
  ];

  const handleCycleRange = () => {
    nexusAudio.playClick(1100);
    if (rangeKm === 50) setRangeKm(150);
    else if (rangeKm === 150) setRangeKm(300);
    else setRangeKm(50);
  };

  if (isMinimized) {
    return (
      <div className="hidden lg:flex fixed bottom-18 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#080d1a]/85 hover:bg-[#0c1527]/95 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-lg transition cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold">RADAR ({rangeKm} KM)</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex fixed bottom-18 right-4 z-20 pointer-events-auto font-mono select-none">
      <div className="w-48 bg-[#080d1a]/90 backdrop-blur-md p-2.5 rounded-xl border border-cyan-500/25 shadow-[0_4px_24px_rgba(0,0,0,0.8)] flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider">TACTICAL RADAR</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCycleRange}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              {rangeKm}KM
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-0.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Circular Radar Sweep Screen */}
        <div className="relative w-42 h-42 mx-auto rounded-full bg-[#050914] border border-cyan-500/30 flex items-center justify-center overflow-hidden">
          {/* Concentric Distance Rings */}
          <div className="absolute w-34 h-34 rounded-full border border-cyan-500/15" />
          <div className="absolute w-22 h-22 rounded-full border border-cyan-500/15" />
          <div className="absolute w-10 h-10 rounded-full border border-cyan-500/20" />

          {/* Crosshair Axes */}
          <div className="absolute inset-x-0 h-px bg-cyan-500/15" />
          <div className="absolute inset-y-0 w-px bg-cyan-500/15" />

          {/* Animated 360 Sweep Beam */}
          <div
            className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,rgba(6,182,212,0.22)_360deg)] animate-spin"
            style={{ animationDuration: '4s' }}
          />

          {/* Player Vessel Pip in Center */}
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_rgba(6,182,212,0.9)] z-10" />

          {/* Contact Blips */}
          {contacts.map((c) => {
            const leftPct = 50 + c.x * 45;
            const topPct = 50 + c.y * 45;
            return (
              <button
                key={c.id}
                onClick={() => {
                  nexusAudio.playConfirm();
                  recordDiscovery(c.id, c.name);
                  selectEntity({
                    id: c.id,
                    name: c.name,
                    type: c.type === 'ufo' ? 'ufo' : 'spacecraft',
                    status: 'TACTICAL RADAR CONTACT',
                    distanceKm: Math.round(Math.hypot(c.x, c.y) * rangeKm),
                    metrics: [
                      { label: 'BEARING', value: (Math.atan2(c.y, c.x) * (180 / Math.PI)).toFixed(0) + '°' },
                      { label: 'CLASSIFICATION', value: c.type.toUpperCase() },
                      { label: 'SIGNAL', value: 'RESOLVED' }
                    ],
                    actions: [
                      { id: 'lock_vector', label: 'LOCK NAVIGATION VECTOR', variant: 'primary' }
                    ]
                  });
                }}
                title={c.name}
                style={{ left: leftPct + '%', top: topPct + '%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-0.5 group cursor-pointer z-10"
              >
                <div className={"w-2 h-2 rounded-full " + c.color + " shadow-md group-hover:scale-150 transition"} />
                <span className="hidden group-hover:block absolute left-3 top-0 px-1 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-[8px] font-bold text-slate-100 whitespace-nowrap z-20">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend strip */}
        <div className="flex items-center justify-between text-[8px] text-slate-400 px-1">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> COLONY</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> TRAFFIC</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" /> ALIEN</span>
        </div>
      </div>
    </div>
  );
};
