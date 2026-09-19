import { type FC, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface NexusMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendRate?: string;
  icon?: ReactNode;
  color?: string;
  status?: 'healthy' | 'warning' | 'critical' | 'info';
  capacity?: number;
  current?: number;
}

export const NexusMetric: FC<NexusMetricProps> = ({
  label,
  value,
  unit,
  trend,
  trendRate,
  icon,
  status = 'info',
  capacity,
  current
}) => {
  const statusBorder = {
    healthy: 'border-emerald-500/20 hover:border-emerald-500/40',
    warning: 'border-amber-500/30 hover:border-amber-500/50',
    critical: 'border-red-500/40 hover:border-red-500/60 bg-red-950/20',
    info: 'border-cyan-500/20 hover:border-cyan-500/40'
  };

  const statusText = {
    healthy: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
    info: 'text-cyan-400'
  };

  return (
    <div className={clsx('flex flex-col p-2 bg-[#0b0f19]/75 rounded-xs border font-mono transition-all', statusBorder[status])}>
      <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
        <span className="flex items-center gap-1">
          {icon && <span className="text-slate-300">{icon}</span>}
          {label}
        </span>
        {trend && (
          <span className="flex items-center text-[9px] gap-0.5">
            {trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
            {trend === 'down' && <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
            {trend === 'neutral' && <Minus className="w-2.5 h-2.5 text-slate-500" />}
            {trendRate && <span className="text-slate-400">{trendRate}</span>}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className={clsx('text-sm font-bold tracking-tight', statusText[status])}>
            {value}
          </span>
          {unit && <span className="text-[10px] text-slate-400">{unit}</span>}
        </div>
        {capacity !== undefined && current !== undefined && (
          <span className="text-[9px] text-slate-500">
            /{capacity}
          </span>
        )}
      </div>

      {capacity !== undefined && current !== undefined && (
        <div className="w-full bg-slate-900 h-1 rounded-xs overflow-hidden mt-1.5 border border-slate-800">
          <div
            className={clsx(
              'h-full transition-all duration-300',
              current / capacity < 0.15 ? 'bg-red-500' : current / capacity < 0.3 ? 'bg-amber-400' : 'bg-cyan-400'
            )}
            style={{ width: `${Math.min(100, Math.max(0, (current / capacity) * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
};
