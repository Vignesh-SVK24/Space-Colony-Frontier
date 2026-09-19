import { type FC, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nexusAudio } from '../../../utils/nexusAudio';

export interface NexusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'active';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  shortcut?: string;
  active?: boolean;
}

export const NexusButton: FC<NexusButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  icon,
  shortcut,
  active = false,
  className,
  onClick,
  disabled,
  ...props
}) => {
  const sizeStyles = {
    xs: 'px-2 py-1 text-[10px] gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 hover:bg-cyan-500/35 hover:border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]',
    secondary: 'bg-slate-900/80 text-slate-200 border border-cyan-500/25 hover:bg-slate-800 hover:border-cyan-400/50 hover:text-white',
    danger: 'bg-red-950/50 text-red-200 border border-red-500/40 hover:bg-red-900/60 hover:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]',
    ghost: 'bg-transparent text-slate-300 border border-transparent hover:bg-cyan-950/30 hover:text-cyan-300 hover:border-cyan-500/20',
    active: 'bg-cyan-500/30 text-white border border-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      nexusAudio.playClick();
      onClick?.(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center font-mono font-medium rounded-xs uppercase tracking-wider transition-all duration-150 cursor-pointer select-none active:scale-[0.98]',
          sizeStyles[size],
          active ? variantStyles.active : variantStyles[variant],
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          className
        )
      )}
      {...props}
    >
      {icon && <span className="flex items-center shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {shortcut && (
        <kbd className="ml-1.5 text-[9px] px-1 py-0.2 bg-slate-950/80 border border-slate-700/60 rounded text-slate-400 font-sans normal-case">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

export const NexusIconButton: FC<Omit<NexusButtonProps, 'children'> & { icon: ReactNode; title?: string }> = ({
  icon,
  title,
  size = 'sm',
  className,
  ...props
}) => {
  const iconSizeStyles = {
    xs: 'p-1 text-xs',
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base'
  };

  return (
    <NexusButton
      size={size}
      title={title}
      className={twMerge(clsx('p-0 aspect-square shrink-0', iconSizeStyles[size], className))}
      {...props}
    >
      {icon}
    </NexusButton>
  );
};
