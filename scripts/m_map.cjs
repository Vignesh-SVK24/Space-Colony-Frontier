const fs = require('fs');
const content = `import { useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { Navigation, Crosshair } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusMapModal: FC = () => {
  const { activeModal, closeModal, addAlert } = useNexusGameStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedPin, setSelectedPin] = useState<{ name: string; type: string; coords: string; desc: string } | null>(null);

  const markers = [
    { id: 'colony', name: 'OUTPOST ALPHA (MAIN COLONY)', type: 'colony', x: 48, y: 52, color: 'bg-cyan-400', coords: '00.42° N, 14.18° W', desc: 'Central atmospheric command hub and landing pads.' },
    { id: 'ship', name: 'SPACECRAFT EXPLORER-X1', type: 'ship', x: 55, y: 46, color: 'bg-blue-400', coords: '02.15° N, 11.02° W', desc: 'Active expedition vessel on reconnaissance vector.' },
    { id: 'signal', name: 'UNKNOWN SIGNAL ANOMALY', type: 'anomaly', x: 28, y: 32, color: 'bg-yellow-400', coords: '18.90° N, 42.10° W', desc: 'Pulse transmission originating from uncharted impact crater.' },
    { id: 'ice', name: 'GLACIAL PERMAFROST BASIN', type: 'resource', x: 74, y: 25, color: 'bg-sky-300', coords: '32.10° N, 08.40° E', desc: 'Subsurface water ice field estimated at 240,000 metric tons.' },
    { id: 'ufo', name: 'UFO CONTACT TRACE UFO-X17', type: 'threat', x: 62, y: 78, color: 'bg-purple-400', coords: '14.50° S, 20.80° E', desc: 'Transient sensor track of non-terrestrial scout vessel.' }
  ];

  const filteredMarkers = markers.filter((m) => activeFilter === 'all' || m.type === activeFilter);

  const handleWaypoint = () => {
    if (!selectedPin) return;
    nexusAudio.playConfirm();
    addAlert({
      type: 'info',
      title: 'TACTICAL WAYPOINT SET',
      message: 'Navigation vector synchronized with ' + selectedPin.name + '.'
    });
  };

  return (
    <NexusModal
      isOpen={activeModal === 'map'}
      onClose={closeModal}
      title="TACTICAL PLANETARY RADAR MAP"
      subtitle="AETHELIA-IV SURFACE CARTOGRAPHY & SATELLITE TELEMETRY"
      badge="SECTOR 04"
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1 text-[11px]">
            {['all', 'colony', 'resource', 'anomaly', 'threat'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setActiveFilter(filter);
                }}
                className={'px-2.5 py-1 rounded-xs uppercase tracking-wider transition ' + (
                  activeFilter === filter
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-cyan-400 tracking-wider">
            RADAR STATUS: ACTIVE SWEEP
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 h-84 sm:h-96 bg-[#060a12] border border-cyan-500/30 rounded-xs relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute w-72 h-72 border border-cyan-500/20 rounded-full" />
            <div className="absolute w-48 h-48 border border-cyan-500/20 rounded-full" />
            <div className="absolute w-24 h-24 border border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(56,189,248,0.15)_360deg)] animate-spin" style={{ animationDuration: '6s' }} />
            {filteredMarkers.map((pin) => (
              <button
                key={pin.id}
                onClick={() => {
                  nexusAudio.playClick(1200);
                  setSelectedPin(pin);
                }}
                style={{ left: pin.x + '%', top: pin.y + '%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-1 group cursor-pointer"
                title={pin.name}
              >
                <div className={'w-3 h-3 rounded-full border border-white shadow-lg animate-ping absolute ' + pin.color} />
                <div className={'w-3 h-3 rounded-full border border-slate-900 shadow-md relative ' + pin.color} />
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[#0b0f19]/90 px-1.5 py-0.5 rounded border border-cyan-500/30 text-slate-200 whitespace-nowrap opacity-80 group-hover:opacity-100 transition pointer-events-none">
                  {pin.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          <div className="lg:col-span-4 bg-slate-950/80 p-4 rounded-xs border border-cyan-500/25 flex flex-col justify-between">
            {selectedPin ? (
              <div className="flex flex-col gap-3">
                <div className="border-b border-cyan-500/20 pb-2">
                  <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                    LOCATION TELEMETRY
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mt-0.5">
                    {selectedPin.name}
                  </h4>
                </div>
                <div className="bg-[#0b0f19] p-2.5 rounded-xs border border-cyan-500/15 flex flex-col gap-1 text-[11px]">
                  <span className="text-slate-400 uppercase text-[9px]">COORDINATES:</span>
                  <span className="text-cyan-300 font-bold">{selectedPin.coords}</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedPin.desc}
                </p>
                <NexusButton
                  variant="primary"
                  size="md"
                  icon={<Navigation className="w-4 h-4" />}
                  onClick={handleWaypoint}
                  className="w-full mt-4"
                >
                  SET TACTICAL WAYPOINT
                </NexusButton>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
                <Crosshair className="w-8 h-8 text-cyan-500/40 mb-2" />
                <span className="text-xs uppercase tracking-widest">
                  SELECT RADAR TARGET TO INSPECT SECTOR
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </NexusModal>
  );
};
`;
fs.writeFileSync('src/components/ui/nexus/modals/NexusMapModal.tsx', content.trim() + '\n', 'utf8');
console.log('NexusMapModal written successfully.');
