const fs = require('fs');
const content = `import { useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { NexusTabs } from '../NexusTabs';
import { BUILDING_DEFS, BuildingType } from '../../../../config/buildingConfig';
import { Hammer, Clock, ShieldCheck, Box } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusBuildModal: FC = () => {
  const { activeModal, closeModal, addAlert } = useNexusGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType>('habitat_dome');

  const categories = [
    { id: 'all', label: 'ALL SCHEMATICS' },
    { id: 'life_support', label: 'HABITAT & LIFE' },
    { id: 'power', label: 'POWER GRID' },
    { id: 'industry', label: 'MINING & INDUSTRY' },
    { id: 'science', label: 'RESEARCH & TECH' },
    { id: 'infrastructure', label: 'INFRASTRUCTURE' },
    { id: 'military', label: 'DEFENSE MATRIX' }
  ];

  const buildingList = Object.values(BUILDING_DEFS).filter(
    (b) => selectedCategory === 'all' || b.category === selectedCategory
  );

  const activeDef = BUILDING_DEFS[selectedBuilding] || BUILDING_DEFS.habitat_dome;

  const handleBuild = () => {
    nexusAudio.playConfirm();
    addAlert({
      type: 'success',
      title: 'CONSTRUCTION PROTOCOL INITIATED',
      message: 'Site surveyed for ' + activeDef.name + '. Scaffolding drones deployed.'
    });
    closeModal();
  };

  return (
    <NexusModal
      isOpen={activeModal === 'build'}
      onClose={closeModal}
      title="COLONY CONSTRUCTION MATRIX"
      subtitle="SELECT SCHEMATIC TO FABRICATE STRUCTURE"
      badge="BUILD MODE"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        <NexusTabs
          tabs={categories}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          size="sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-1">
            {buildingList.map((b) => {
              const isSelected = selectedBuilding === b.type;
              return (
                <div
                  key={b.type}
                  onClick={() => {
                    nexusAudio.playClick(1100);
                    setSelectedBuilding(b.type);
                  }}
                  className={'p-3 rounded-xs border transition-all cursor-pointer select-none flex items-center justify-between ' + (
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                      : 'bg-[#0b0f19]/70 border-cyan-500/15 hover:bg-slate-900/80 hover:border-cyan-500/30 text-slate-300'
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {b.name}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                      TIER 1 • {b.category.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {b.powerUse > 0 ? '-' + b.powerUse + ' kW' : b.powerUse < 0 ? '+' + Math.abs(b.powerUse) + ' kW' : '0 kW'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="md:col-span-5 bg-slate-950/80 p-4 rounded-xs border border-cyan-500/25 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="border-b border-cyan-500/20 pb-2">
                <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                  BLUEPRINT SPECIFICATION
                </span>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mt-0.5">
                  {activeDef.name}
                </h4>
              </div>
              <div className="h-24 bg-[#0b0f19] rounded-xs border border-cyan-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                <Box className="w-8 h-8 text-cyan-400/70 animate-pulse mb-1" />
                <span className="text-[9px] text-cyan-400/80 tracking-widest uppercase">
                  3D HOLOGRAM SCHEMATIC
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {activeDef.description}
              </p>
              <div className="flex flex-col gap-1 bg-[#0b0f19] p-2 rounded-xs border border-cyan-500/15">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  CONSTRUCTION FEEDSTOCK:
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(activeDef.cost).map(([res, amt]) => (
                    <span key={res} className="text-[10px] px-2 py-0.5 bg-slate-900 rounded border border-cyan-500/20 text-cyan-300 font-mono">
                      {res.toUpperCase()}: {amt}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>TIME: {activeDef.buildTimeHours}h</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HULL: {activeDef.maxHealth} HP</span>
                </div>
              </div>
            </div>
            <NexusButton
              variant="primary"
              size="md"
              icon={<Hammer className="w-4 h-4" />}
              onClick={handleBuild}
              className="w-full mt-4"
            >
              DEPLOY STRUCTURE
            </NexusButton>
          </div>
        </div>
      </div>
    </NexusModal>
  );
};
`;
fs.writeFileSync('src/components/ui/nexus/modals/NexusBuildModal.tsx', content.trim() + '\n', 'utf8');
console.log('NexusBuildModal written successfully.');
