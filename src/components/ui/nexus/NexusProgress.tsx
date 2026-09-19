import { type FC } from 'react';
import { clsx } from 'clsx';

export interface NexusProgressProps {
  value: number; // 0 to 100
  max?: number;
  segments?: number;
  color?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple';
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const NexusProgress: FC<NexusProgressProps> = ({
  value,
  max = 100,
  segments,
  color = 'cyan',
  showLabel = false,
  size = 'sm'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorStyles = {
    cyan: 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]',
    emerald: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    amber: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    red: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
    purple: 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]'
  };

  const heightStyles = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5'
  };

  if (segments && segments > 1) {
    const activeSegments = Math.round((percentage / 100) * segments);
    return (
      <div className="flex items-center gap-1 w-full">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'flex-1 rounded-xs transition-all duration-150',
              heightStyles[size],
              i < activeSegments ? colorStyles[color] : 'bg-slate-800/80 border border-slate-700/40'
            )}
          />
        ))}
        {showLabel && (
          <span className="text-[10px] font-mono text-slate-400 ml-1.5 shrink-0">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={clsx('w-full bg-slate-900/90 rounded-xs border border-cyan-500/20 overflow-hidden relative', heightStyles[size])}>
        <div
          className={clsx('h-full transition-all duration-300', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono text-slate-400 shrink-0">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};
