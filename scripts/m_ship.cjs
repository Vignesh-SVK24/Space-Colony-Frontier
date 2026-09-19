const fs = require('fs');
const content = `import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { NexusProgress } from '../NexusProgress';
import { Rocket, Shield, Fuel, Gauge, Zap, Compass } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusShipModal: FC = () => {
  const { activeModal, closeModal, addAlert } = useNexusGameStore();

  const handleBoost = () => {
    nexusAudio.playConfirm();
    addAlert({
      type: 'info',
      title: 'AUXILIARY THRUSTERS FIRED',
      message: 'Burn cycle active. Spaceship velocity increased to 240 km/s.'
    });
  };

  return (
    <NexusModal
      isOpen={activeModal === 'ship'}
      onClose={closeModal}
      title="SPACECRAFT TELEMETRY & FLIGHT DECK"
      subtitle="EXPLORER-X1 'HORIZON-1' STATUS"
      badge="FLIGHT MODE"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>FUEL RESERVE</span>
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-lg font-bold text-amber-300">72%</span>
            <NexusProgress value={72} color="amber" size="xs" />
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>DEFLECTOR SHIELD</span>
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-cyan-300">89%</span>
            <NexusProgress value={89} color="cyan" size="xs" />
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>CRUISING SPEED</span>
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold text-slate-100">184 <span className="text-xs">KM/S</span></span>
            <span className="text-[9px] text-emerald-400">MACH 540</span>
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>CARGO BAY</span>
              <Rocket className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-lg font-bold text-purple-300">61%</span>
            <NexusProgress value={61} color="purple" size="xs" />
          </div>
        </div>
        <div className="flex gap-2">
          <NexusButton
            variant="primary"
            size="md"
            icon={<Zap className="w-4 h-4" />}
            onClick={handleBoost}
            className="flex-1"
          >
            ENGAGE BOOST THRUST
          </NexusButton>
          <NexusButton
            variant="secondary"
            size="md"
            icon={<Compass className="w-4 h-4" />}
            onClick={() => {
              nexusAudio.playClick();
              addAlert({ type: 'info', title: 'RETURN VECTOR PLOTTED', message: 'Autonomous autopilot locked to Landing Pad 01.' });
            }}
            className="flex-1"
          >
            RETURN TO LANDING PAD
          </NexusButton>
        </div>
      </div>
    </NexusModal>
  );
};
`;
fs.writeFileSync('src/components/ui/nexus/modals/NexusShipModal.tsx', content.trim() + '\n', 'utf8');
console.log('NexusShipModal written successfully.');
