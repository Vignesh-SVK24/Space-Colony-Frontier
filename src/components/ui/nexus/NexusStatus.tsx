import { type FC } from 'react';
import { clsx } from 'clsx';
import { NexusStatusType } from './tokens';

export interface NexusStatusProps {
  status: NexusStatusType;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const NexusStatus: FC<NexusStatusProps> = ({
  status,
  label,
  pulse = true,
  size = 'sm'
}) => {
  const statusColors = {
    healthy: 'bg-emerald-400 border-emerald-500 text-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    warning: 'bg-amber-400 border-amber-500 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    critical: 'bg-red-500 border-red-600 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
    info: 'bg-cyan-400 border-cyan-500 text-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]',
    discovery: 'bg-purple-400 border-purple-500 text-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]',
    alien: 'bg-yellow-400 border-yellow-500 text-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]'
  };

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span
        className={clsx(
          'rounded-full border shrink-0',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          statusColors[status],
          pulse && 'animate-pulse'
        )}
      />
      {label && <span className="uppercase text-[10px] tracking-wider font-semibold text-slate-300">{label}</span>}
    </div>
  );
};

export const NexusBadge: FC<{
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
  size?: 'xs' | 'sm';
}> = ({ children, variant = 'cyan', size = 'xs' }) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
    emerald: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
    amber: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
    red: 'bg-red-950/60 border-red-500/40 text-red-300',
    purple: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
    slate: 'bg-slate-900/60 border-slate-700/40 text-slate-400'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center uppercase tracking-widest font-mono border rounded-xs font-semibold',
        size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5',
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
};
