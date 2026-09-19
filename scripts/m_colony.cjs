const fs = require('fs');
const content = `import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusProgress } from '../NexusProgress';
import { ShieldCheck, Heart, Users, Thermometer, Zap, Wind, Droplets } from 'lucide-react';

export const NexusColonyModal: FC = () => {
  const { activeModal, closeModal, colonyVitals } = useNexusGameStore();

  return (
    <NexusModal
      isOpen={activeModal === 'colony'}
      onClose={closeModal}
      title="COLONY INTELLIGENCE & HABITATION REPORT"
      subtitle="SYSTEMS DIAGNOSTICS & POPULATION VITALS"
      badge="OPTIMAL TIER"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>HEALTH</span>
              <Heart className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="text-lg font-bold text-slate-100">{colonyVitals.health}%</span>
            <NexusProgress value={colonyVitals.health} color="emerald" size="xs" />
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>MORALE</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-lg font-bold text-slate-100">{colonyVitals.morale}%</span>
            <NexusProgress value={colonyVitals.morale} color="purple" size="xs" />
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>SECURITY</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-slate-100">{colonyVitals.security}%</span>
            <NexusProgress value={colonyVitals.security} color="cyan" size="xs" />
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-xs border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>TEMP</span>
              <Thermometer className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-lg font-bold text-slate-100">{colonyVitals.temperature}°C</span>
            <span className="text-[9px] text-slate-400">HABITAT: +21°C</span>
          </div>
        </div>
        <div className="bg-[#0b0f19]/80 p-4 rounded-xs border border-cyan-500/20 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            LIFE SUPPORT BALANCE TELEMETRY:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xs border border-slate-800">
              <Wind className="w-4 h-4 text-sky-400" />
              <div>
                <div className="font-bold text-slate-200">O2 RECOVERY</div>
                <div className="text-[10px] text-emerald-400 font-bold">+8.4 u/min (STABLE)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xs border border-slate-800">
              <Droplets className="w-4 h-4 text-blue-400" />
              <div>
                <div className="font-bold text-slate-200">POTABLE H2O</div>
                <div className="text-[10px] text-emerald-400 font-bold">+5.2 u/min (NET POSITIVE)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xs border border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-bold text-slate-200">POWER GRID</div>
                <div className="text-[10px] text-cyan-300 font-bold">48 kW GEN / 32 kW DEMAND</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NexusModal>
  );
};
`;
fs.writeFileSync('src/components/ui/nexus/modals/NexusColonyModal.tsx', content.trim() + '\n', 'utf8');
console.log('NexusColonyModal written successfully.');
