import { useState, type FC } from 'react';
import { useNexusGameStore, MapScaleLevel } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { Compass, Globe, CircleDot, Sparkles, Navigation } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusMapModal: FC = () => {
  const { activeModal, closeModal, addAlert, mapScale, setMapScale } = useNexusGameStore();
  const [selectedPin, setSelectedPin] = useState<{
    id: string;
    name: string;
    type: string;
    scale: MapScaleLevel;
    x: number;
    y: number;
    color: string;
    coords: string;
    desc: string;
  } | null>(null);

  const pins = [
    // Surface Level
    { id: 'colony', name: 'OUTPOST ALPHA (MAIN HUB)', type: 'colony', scale: 'surface' as const, x: 50, y: 50, color: 'bg-cyan-400', coords: '00.42° N, 14.18° W', desc: 'Central planetary headquarters, landing tarmac, and quantum core.' },
    { id: 'ice-basin', name: 'PERMAFROST CRYO-BASIN', type: 'resource', scale: 'surface' as const, x: 68, y: 35, color: 'bg-sky-400', coords: '22.10° N, 04.30° W', desc: 'Subsurface water ice glacier surveyed at 240,000 metric tons.' },
    { id: 'iron-ridge', name: 'CRATER ORE QUARRY', type: 'resource', scale: 'surface' as const, x: 32, y: 64, color: 'bg-slate-400', coords: '18.40° S, 28.50° W', desc: 'Exposed ferrous regolith deposits suitable for automated strip mining.' },

    // Orbit Level
    { id: 'apex-station', name: 'APEX ORBITAL STATION', type: 'station', scale: 'orbit' as const, x: 50, y: 30, color: 'bg-cyan-300', coords: 'ALT: 104 KM · INC: 12°', desc: 'Primary deep-space science outpost with centrifuge gravity torus.' },
    { id: 'depot-beta', name: 'MINING DEPOT BETA', type: 'station', scale: 'orbit' as const, x: 28, y: 65, color: 'bg-amber-400', coords: 'ALT: 125 KM · INC: -22°', desc: 'High-volume asteroid ore refinery and automated cargo terminus.' },
    { id: 'sat-nav', name: 'NAV-SAT CONSTELLATION', type: 'satellite', scale: 'orbit' as const, x: 74, y: 48, color: 'bg-emerald-400', coords: 'ALT: 48 KM · 6 ASSETS', desc: 'Synchronized telemetry constellation providing 99.2% planetary coverage.' },

    // Planet System Level
    { id: 'aethelia', name: 'AETHELIA-IV (HOME WORLD)', type: 'planet', scale: 'system' as const, x: 50, y: 50, color: 'bg-cyan-400', coords: 'SECTOR 04 · PRIMARY', desc: 'Terrestrial frontier world. Class-M habitable candidate.' },
    { id: 'selene-prime', name: 'MOON SELENE-PRIME', type: 'moon', scale: 'system' as const, x: 72, y: 38, color: 'bg-slate-200', coords: 'DIST: 185 KM · ORBIT SYNCH', desc: 'Major natural satellite with high-grade titanium silicate mantle.' },
    { id: 'belt-alpha', name: 'ASTEROID BELT ALPHA (IRON)', type: 'asteroid', scale: 'system' as const, x: 34, y: 28, color: 'bg-slate-400', coords: 'RADIUS: 120 KM', desc: 'Dense mineral belt containing 450,000 tons of ferrous ore.' },
    { id: 'ufo-valkyrie', name: 'UFO-X17 ANOMALOUS TRACK', type: 'threat', scale: 'system' as const, x: 82, y: 76, color: 'bg-purple-400', coords: 'WARP FREQ: 14.8 GHz', desc: 'Non-terrestrial scout vessel exhibiting exotic gravitational drive.' },

    // Deep Space Level
    { id: 'sun', name: 'SOLAR STAR (HELIOS)', type: 'star', scale: 'deep_space' as const, x: 50, y: 22, color: 'bg-amber-400', coords: '0.00 AU · G-CLASS', desc: 'Luminous primary star providing solar radiation and energy to system.' },
    { id: 'gorgon', name: 'GAS GIANT GORGON', type: 'planet', scale: 'deep_space' as const, x: 26, y: 68, color: 'bg-orange-400', coords: '3.4 AU · JOVIAN', desc: 'Ringed gas colossus with dense methane-helium atmosphere.' },
    { id: 'boreas', name: 'ICE WORLD BOREAS', type: 'planet', scale: 'deep_space' as const, x: 78, y: 55, color: 'bg-sky-400', coords: '2.8 AU · GLACIAL', desc: 'Frozen terrestrial world with sub-zero cryo-permafrost oceans.' }
  ];

  const currentPins = pins.filter((p) => p.scale === mapScale);

  const handleWaypoint = () => {
    if (!selectedPin) return;
    nexusAudio.playConfirm();
    addAlert({
      type: 'info',
      title: 'AUTOPILOT VECTOR LOCKED',
      message: 'Navigation flight computer synchronized trajectory with ' + selectedPin.name + '.'
    });
  };

  const scaleLabels: { key: MapScaleLevel; label: string; icon: any }[] = [
    { key: 'surface', label: 'SURFACE', icon: Compass },
    { key: 'orbit', label: 'ORBIT', icon: Globe },
    { key: 'system', label: 'SYSTEM', icon: CircleDot },
    { key: 'deep_space', label: 'DEEP SPACE', icon: Sparkles }
  ];

  return (
    <NexusModal
      isOpen={activeModal === 'map'}
      onClose={closeModal}
      title="NEXUS NAVIGATION MAP 2.0"
      subtitle="MULTI-TIER CELESTIAL ASTROGATION & TACTICAL RADAR"
      badge="TACTICAL 3D"
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-4 font-mono">
        {/* Tier Scale Selector Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-md border border-cyan-500/25">
            {scaleLabels.map((tier) => {
              const Icon = tier.icon;
              const isActive = mapScale === tier.key;
              return (
                <button
                  key={tier.key}
                  onClick={() => {
                    nexusAudio.playClick(1000);
                    setMapScale(tier.key);
                    setSelectedPin(null);
                  }}
                  className={'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ' + (
                    isActive
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold">STATUS: TELEMETRY SYNCED</span>
          </div>
        </div>

        {/* Map View Grid & Cartography Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 h-96 bg-[#050914] border border-cyan-500/30 rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner">
            {/* Holographic Polar Coordinates & Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <div className="absolute w-80 h-80 border border-cyan-500/15 rounded-full" />
            <div className="absolute w-56 h-56 border border-cyan-500/15 rounded-full" />
            <div className="absolute w-32 h-32 border border-cyan-500/20 rounded-full" />

            {/* Sweep radar line */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,rgba(6,182,212,0.18)_360deg)] animate-spin" style={{ animationDuration: '6s' }} />

            {/* Scale Center Marker */}
            <div className="absolute w-3 h-3 rounded-full border border-cyan-400 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-cyan-400" />
            </div>

            {/* Location & Entity Pins */}
            {currentPins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => {
                  nexusAudio.playClick(1200);
                  setSelectedPin(pin);
                }}
                style={{ left: pin.x + '%', top: pin.y + '%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 group cursor-pointer z-10"
                title={pin.name}
              >
                <div className={'w-3 h-3 rounded-full border border-white animate-ping absolute ' + pin.color} />
                <div className={'w-3 h-3 rounded-full border border-slate-900 relative shadow-md ' + pin.color} />
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[#080d1a]/95 px-2 py-0.5 rounded border border-cyan-500/40 text-slate-100 whitespace-nowrap shadow-lg group-hover:scale-105 transition pointer-events-none">
                  {pin.name.split(' (')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Telemetry Detail Sidebar */}
          <div className="lg:col-span-4 bg-[#080d1a]/90 p-4 rounded-lg border border-cyan-500/25 flex flex-col justify-between shadow-lg">
            {selectedPin ? (
              <div className="flex flex-col gap-3">
                <div className="border-b border-cyan-500/20 pb-2">
                  <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                    SECTOR TELEMETRY
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mt-0.5">
                    {selectedPin.name}
                  </h4>
                  <div className="text-[11px] text-cyan-300 font-semibold mt-1">
                    {selectedPin.coords}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedPin.desc}
                </p>

                <div className="bg-slate-950/70 p-2.5 rounded border border-cyan-500/15 flex flex-col gap-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">LAYER SCALE:</span>
                    <span className="text-cyan-300 font-bold uppercase">{selectedPin.scale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TRACKING BEACON:</span>
                    <span className="text-emerald-400 font-bold">RESOLVED (100%)</span>
                  </div>
                </div>

                <NexusButton variant="primary" size="md" onClick={handleWaypoint} className="w-full mt-2">
                  <Navigation className="w-4 h-4 mr-1.5" />
                  ENGAGE AUTOPILOT LOCK
                </NexusButton>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                <Compass className="w-10 h-10 text-cyan-500/30 mb-2 animate-spin" style={{ animationDuration: '20s' }} />
                <span className="text-xs font-bold text-slate-400">NO TARGET SELECTED</span>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  Click any planetary beacon or orbital asset on the radar grid to inspect coordinates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </NexusModal>
  );
};
