import { useState, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { NexusTabs } from '../NexusTabs';
import { Cpu, CheckCircle, Lock, Play } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusResearchModal: FC = () => {
  const { activeModal, closeModal, resources, addAlert } = useNexusGameStore();
  const [selectedBranch, setSelectedBranch] = useState<string>('survival');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('surv_1');

  const branches = [
    { id: 'survival', label: 'SURVIVAL' },
    { id: 'mining', label: 'MINING' },
    { id: 'energy', label: 'ENERGY' },
    { id: 'robotics', label: 'ROBOTICS' },
    { id: 'ai', label: 'AI AUTOMATION' },
    { id: 'spaceflight', label: 'SPACEFLIGHT' },
    { id: 'defense', label: 'DEFENSE' },
    { id: 'alien', label: 'ALIEN TECH' }
  ];

  const branchNodes: Record<string, { id: string; title: string; cost: number; status: 'completed' | 'researching' | 'available' | 'locked'; description: string; unlock: string }[]> = {
    survival: [
      { id: 'surv_1', title: 'Atmospheric Reclamation', cost: 150, status: 'completed', description: 'Advanced membrane electrolysis yielding +20% Oxygen recovery.', unlock: 'Oxygen Generator Tier 2' },
      { id: 'surv_2', title: 'Hydroponic Genetic Tuning', cost: 300, status: 'researching', description: 'Enhanced crop radiation resistance reducing water consumption by 15%.', unlock: 'Greenhouse Tier 2' },
      { id: 'surv_3', title: 'Cryogenic Permafrost Drilling', cost: 550, status: 'available', description: 'Subsurface thermal resonance extraction of glacial water.', unlock: 'Deep Ice Well' },
      { id: 'surv_4', title: 'Synthetic Ecosystem Cycling', cost: 900, status: 'locked', description: 'Closed-loop organic regeneration balancing colony biomes.', unlock: 'Biosphere Dome' }
    ],
    mining: [
      { id: 'mine_1', title: 'Subsurface Ultrasonic Sensors', cost: 200, status: 'completed', description: 'Reveals underground ore veins within 5 km radius.', unlock: 'Ore Prospector Scanner' },
      { id: 'mine_2', title: 'Titanium Smelting Optimization', cost: 450, status: 'available', description: 'High-temperature catalytic refining yielding +25% Titanium.', unlock: 'Advanced Smelter' },
      { id: 'mine_3', title: 'Automated Excavation Drones', cost: 750, status: 'locked', description: 'Self-guiding mining rovers capable of continuous autonomous extraction.', unlock: 'Mining Rover Mk.II' }
    ],
    energy: [
      { id: 'eng_1', title: 'Photovoltaic Quantum Coatings', cost: 250, status: 'completed', description: 'Improves solar conversion efficiency across low-light angles.', unlock: 'Solar Panel Efficiency +30%' },
      { id: 'eng_2', title: 'Superconducting Energy Capacitors', cost: 500, status: 'available', description: 'Zero-resistance battery arrays storing +1,000 kWh.', unlock: 'Battery Bank Tier 2' },
      { id: 'eng_3', title: 'Compact Fusion Reactor', cost: 1200, status: 'locked', description: 'Clean deuterium-helium fusion powering heavy industrial districts.', unlock: 'Fusion Generator' }
    ],
    robotics: [
      { id: 'rob_1', title: 'Autonomous Repair Protocols', cost: 350, status: 'available', description: 'Drone nanite dispensers fixing damaged structural sections.', unlock: 'Repair Drone' },
      { id: 'rob_2', title: 'Heavy Gantry Transports', cost: 650, status: 'locked', description: 'Automated logistics haulers balancing warehouse resource quotas.', unlock: 'Cargo Rover' }
    ],
    ai: [
      { id: 'ai_1', title: 'Colony Subsystem Heuristics', cost: 400, status: 'available', description: 'AI predictive load shedding to prevent brownouts.', unlock: 'Smart Power Grid' },
      { id: 'ai_2', title: 'Autonomous Colonist Scheduling', cost: 800, status: 'locked', description: 'Optimizes work/rest intervals boosting morale by +10%.', unlock: 'Colony Management AI' }
    ],
    spaceflight: [
      { id: 'space_1', title: 'Ion Propulsion Tuning', cost: 300, status: 'completed', description: 'Increases spacecraft cruising speed by +25%.', unlock: 'Ship Engine Upgrade Mk.I' },
      { id: 'space_2', title: 'Kinetic Deflector Shielding', cost: 600, status: 'available', description: 'Absorbs micrometeorite and debris impacts without hull wear.', unlock: 'Deflector Shield Tier 2' }
    ],
    defense: [
      { id: 'def_1', title: 'Point-Defense Plasma Arrays', cost: 400, status: 'available', description: 'Automated tracking cannons destroying inbound meteors.', unlock: 'Plasma Turret' },
      { id: 'def_2', title: 'Colony Energy Dome Barrier', cost: 1500, status: 'locked', description: 'Electromagnetic shield deflecting solar radiation storms.', unlock: 'Perimeter Barrier' }
    ],
    alien: [
      { id: 'aln_1', title: 'Xenomaterial Crystallography', cost: 600, status: 'available', description: 'Analysis of recovered alien artifacts revealing zero-gravity alloy secrets.', unlock: 'Quantum Conduit' },
      { id: 'aln_2', title: 'Hyperspatial Beacon Decryption', cost: 1400, status: 'locked', description: 'Translates extraterrestrial subspace communication harmonics.', unlock: 'Alien Translator' }
    ]
  };

  const currentNodes = branchNodes[selectedBranch] || branchNodes.survival;
  const activeNode = currentNodes.find((n) => n.id === selectedNodeId) || currentNodes[0];

  const handleStartResearch = () => {
    nexusAudio.playDiscovery();
    addAlert({
      type: 'discovery',
      title: 'RESEARCH PROJECT ENGAGED',
      message: 'Scientific labs focused on: ' + activeNode.title + '.'
    });
  };

  return (
    <NexusModal
      isOpen={activeModal === 'research'}
      onClose={closeModal}
      title="NEXUS SCIENTIFIC RESEARCH MATRIX"
      subtitle={'AVAILABLE RESEARCH POINTS: ' + Math.round(resources.research.current) + ' RP'}
      badge="TECH TREE"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        <NexusTabs
          tabs={branches}
          activeTab={selectedBranch}
          onChange={(b) => {
            setSelectedBranch(b);
            const first = (branchNodes[b] || [])[0];
            if (first) setSelectedNodeId(first.id);
          }}
          size="sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 flex flex-col gap-3">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              {selectedBranch.toUpperCase()} TECHNOLOGY NODES:
            </span>
            <div className="flex flex-col gap-2.5">
              {currentNodes.map((node, i) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      nexusAudio.playClick(1100);
                      setSelectedNodeId(node.id);
                    }}
                    className={'p-3 rounded-xs border transition-all cursor-pointer flex items-center justify-between ' + (
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : node.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : node.status === 'locked'
                        ? 'bg-slate-950/50 border-slate-800 text-slate-500'
                        : 'bg-[#0b0f19]/80 border-cyan-500/20 text-slate-300 hover:border-cyan-400/40'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {node.title}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest opacity-70">
                          {node.status} � {node.cost} RP
                        </span>
                      </div>
                    </div>
                    {node.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {node.status === 'locked' && <Lock className="w-4 h-4 text-slate-600 shrink-0" />}
                    {node.status === 'researching' && <Cpu className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-5 bg-slate-950/80 p-4 rounded-xs border border-cyan-500/25 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="border-b border-cyan-500/20 pb-2">
                <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                  PROJECT SPECIFICATION
                </span>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mt-0.5">
                  {activeNode.title}
                </h4>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {activeNode.description}
              </p>
              <div className="bg-[#0b0f19] p-2.5 rounded-xs border border-cyan-500/15 flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  TECHNOLOGY UNLOCKS:
                </span>
                <span className="text-xs text-emerald-300 font-bold">
                  ? {activeNode.unlock}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono bg-slate-900/60 p-2 rounded-xs border border-slate-800">
                <span className="text-slate-400">RESEARCH COST:</span>
                <span className="font-bold text-cyan-300">{activeNode.cost} RP</span>
              </div>
            </div>
            <NexusButton
              variant={activeNode.status === 'completed' ? 'secondary' : 'primary'}
              size="md"
              disabled={activeNode.status === 'completed' || activeNode.status === 'locked'}
              icon={<Play className="w-4 h-4" />}
              onClick={handleStartResearch}
              className="w-full mt-4"
            >
              {activeNode.status === 'completed' ? 'RESEARCH COMPLETED' : activeNode.status === 'locked' ? 'PREREQUISITES REQUIRED' : 'INITIATE RESEARCH'}
            </NexusButton>
          </div>
        </div>
      </div>
    </NexusModal>
  );
};
