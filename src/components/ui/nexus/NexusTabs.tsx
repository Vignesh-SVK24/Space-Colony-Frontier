import { type FC } from 'react';
import { clsx } from 'clsx';
import { nexusAudio } from '../../../utils/nexusAudio';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface NexusTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
}

export const NexusTabs: FC<NexusTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  size = 'sm'
}) => {
  return (
    <div className="flex items-center gap-1 border-b border-cyan-500/20 pb-1 font-mono overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              nexusAudio.playClick(1000);
              onChange(tab.id);
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider rounded-xs border transition-all cursor-pointer select-none whitespace-nowrap',
              size === 'sm' ? 'text-[11px] py-1' : 'text-xs py-1.5',
              isActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={clsx('text-[9px] px-1 py-0.2 rounded-xs border', isActive ? 'border-cyan-400/50 bg-cyan-950 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-400')}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
