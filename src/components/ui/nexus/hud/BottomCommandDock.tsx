import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Hammer, Cpu, Compass, Box, Rocket, Building2 } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomCommandDock: FC = () => {
  const { activeModal, openModal, closeModal } = useNexusGameStore();

  const dockItems = [
    { id: 'build' as const, label: 'BUILD', icon: <Hammer className="w-4 h-4" />, shortcut: 'B' },
    { id: 'research' as const, label: 'RESEARCH', icon: <Cpu className="w-4 h-4" />, shortcut: 'T' },
    { id: 'map' as const, label: 'MAP', icon: <Compass className="w-4 h-4" />, shortcut: 'M' },
    { id: 'ship' as const, label: 'SHIP', icon: <Rocket className="w-4 h-4" />, shortcut: 'H' },
    { id: 'colony' as const, label: 'COLONY', icon: <Building2 className="w-4 h-4" />, shortcut: 'G' },
    { id: 'alien' as const, label: 'CONTACT', icon: <Box className="w-4 h-4" />, shortcut: 'X' }
  ];

  const handleToggle = (id: typeof dockItems[number]['id']) => {
    if (activeModal === id) {
      closeModal();
    } else {
      openModal(id);
    }
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none font-mono select-none">
      <div className="flex items-center gap-1 sm:gap-1.5 bg-[#0b0f19]/90 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-xs border border-cyan-500/30 pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.8)]">
        {dockItems.map((item) => {
          const isActive = activeModal === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={clsx(
                'flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xs transition-all cursor-pointer select-none border',
                isActive
                  ? 'bg-cyan-500/25 border-cyan-300 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)] scale-105'
                  : 'bg-slate-900/60 border-cyan-500/15 text-slate-300 hover:bg-slate-800 hover:border-cyan-400/40 hover:text-white'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {item.label}
              </span>
              <kbd className="hidden lg:inline-block text-[8px] px-1 bg-slate-950/80 border border-slate-700/60 rounded text-slate-400 ml-1">
                {item.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
