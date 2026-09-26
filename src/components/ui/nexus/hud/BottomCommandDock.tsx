import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Hammer, Cpu, Compass, Box, Rocket, Building2, Sliders } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomCommandDock: FC = () => {
  const { activeModal, openModal, closeModal, hudVisible } = useNexusGameStore();

  const dockItems = [
    { id: 'build' as const, label: 'BUILD', icon: <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'B' },
    { id: 'research' as const, label: 'TECH', icon: <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'T' },
    { id: 'map' as const, label: 'ORBIT', icon: <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'M' },
    { id: 'ship' as const, label: 'HANGAR', icon: <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'K' },
    { id: 'colony' as const, label: 'COLONY', icon: <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'G' },
    { id: 'alien' as const, label: 'ALIEN', icon: <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'X' },
    { id: 'graphics' as const, label: 'GFX', icon: <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'O' }
  ];

  const handleToggle = (id: typeof dockItems[number]['id']) => {
    if (activeModal === id) {
      closeModal();
    } else {
      openModal(id);
    }
  };

  if (!hudVisible) return null;

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none font-mono select-none">
      <div className="flex items-center gap-1 sm:gap-1.5 bg-[#080d1a]/85 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-lg border border-cyan-500/25 pointer-events-auto shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        {dockItems.map((item) => {
          const isActive = activeModal === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={clsx(
                'flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer select-none border',
                isActive
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-slate-900/50 border-cyan-500/15 text-slate-300 hover:bg-slate-800/80 hover:border-cyan-400/40 hover:text-white'
              )}
            >
              <span className="shrink-0 text-cyan-400">{item.icon}</span>
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
