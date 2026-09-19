import { type FC, type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface NexusPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'critical' | 'alert';
  glow?: boolean;
  cornerAccents?: boolean;
  className?: string;
}

export const NexusPanel: FC<NexusPanelProps> = ({
  children,
  title,
  subtitle,
  headerRight,
  variant = 'default',
  glow = false,
  cornerAccents = true,
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#0b0f19]/85 border-cyan-500/20 text-slate-200',
    elevated: 'bg-[#0f172a]/90 border-cyan-400/35 text-slate-100 shadow-2xl',
    subtle: 'bg-[#030712]/70 border-slate-700/30 text-slate-300',
    critical: 'bg-[#18080a]/90 border-red-500/40 text-red-100 shadow-red-950/40',
    alert: 'bg-[#1a1408]/90 border-amber-500/40 text-amber-100 shadow-amber-950/40'
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-sm backdrop-blur-md border font-mono transition-all duration-200 select-none',
          variantStyles[variant],
          glow && 'shadow-[0_0_15px_rgba(56,189,248,0.15)]',
          className
        )
      )}
      {...props}
    >
      {/* Corner Technical Accents */}
      {cornerAccents && (
        <>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-400/70 pointer-events-none" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-400/70 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-400/70 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-400/70 pointer-events-none" />
        </>
      )}

      {/* Optional Technical Header */}
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/15 bg-cyan-950/20">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-xs animate-pulse" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-cyan-300">
                {title}
              </div>
              {subtitle && (
                <div className="text-[10px] text-slate-400 tracking-normal font-sans">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {headerRight && <div className="flex items-center gap-1.5">{headerRight}</div>}
        </div>
      )}

      {/* Panel Content */}
      <div className="p-3">{children}</div>
    </div>
  );
};
