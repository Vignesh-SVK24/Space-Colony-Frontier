import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { Radio, Eye, MessageSquare, Sparkles } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusAlienModal: FC = () => {
  const { activeModal, closeModal, addAlert } = useNexusGameStore();

  const handleCommunicate = () => {
    nexusAudio.playDiscovery();
    addAlert({
      type: 'alien',
      title: 'SUBSPACE TRANSMISSION SENT',
      message: 'Broadcasting peaceful mathematical greetings on 1420.4 MHz.'
    });
  };

  const handleScan = () => {
    nexusAudio.playScan();
    addAlert({
      type: 'discovery',
      title: 'SPECTRAL FREQUENCY ACQUIRED',
      message: 'Target hull alloy shows unknown crystal lattice with zero thermal dissipation.'
    });
  };

  return (
    <NexusModal
      isOpen={activeModal === 'alien'}
      onClose={closeModal}
      title="EXTRATERRESTRIAL CONTACT PROTOCOL"
      subtitle="UNIDENTIFIED FLYING OBJECT TELEMETRY"
      badge="ENCOUNTER: ACTIVE"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-[#140f08]/90 p-4 rounded-xs border border-yellow-500/40 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-yellow-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
                  DESIGNATION: UFO-X17 "SPECTER"
                </div>
                <div className="text-[10px] text-slate-400">
                  ESTIMATED RANGE: 4.1 KM � SECTOR: HIGH ORBIT
                </div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-yellow-950/80 border border-yellow-500/40 text-yellow-300 rounded font-bold uppercase tracking-widest">
              OBSERVING
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            The target vessel entered planetary orbit at 14:35. It is hovering with a periodic sinusoidal oscillation. Analysis indicates high-energy sensor sweeps focused on our Quantum Core Beacon. No hostile weapons fire detected.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <NexusButton
            variant="primary"
            size="md"
            icon={<MessageSquare className="w-4 h-4" />}
            onClick={handleCommunicate}
          >
            HAIL / COMMUNICATE
          </NexusButton>
          <NexusButton
            variant="secondary"
            size="md"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={handleScan}
          >
            DEEP SPECTRAL SCAN
          </NexusButton>
          <NexusButton
            variant="secondary"
            size="md"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => {
              nexusAudio.playConfirm();
              addAlert({ type: 'info', title: 'TRACKING BEACON ATTACHED', message: 'Sensor locks engaged.' });
            }}
          >
            MAINTAIN RADAR TRACK
          </NexusButton>
          <NexusButton
            variant="ghost"
            size="md"
            onClick={closeModal}
          >
            CLOSE CONTACT WINDOW
          </NexusButton>
        </div>
      </div>
    </NexusModal>
  );
};
