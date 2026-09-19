import { type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { NexusIconButton } from './NexusButton';
import { nexusAudio } from '../../../utils/nexusAudio';

export interface NexusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
}

export const NexusModal: FC<NexusModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth = '2xl'
}) => {
  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '4xl': 'max-w-7xl',
    full: 'max-w-[95vw] h-[90vh]'
  };

  const handleClose = () => {
    nexusAudio.playClick(900);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} max-h-[90vh] flex flex-col bg-[#0b0f19]/95 border border-cyan-500/30 rounded-xs shadow-[0_0_30px_rgba(0,0,0,0.8)] font-mono overflow-hidden`}
      >
        {/* Technical Corner Accents */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-cyan-950/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-cyan-200">
                  {title}
                </h3>
                {badge && (
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded-xs text-cyan-300">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-slate-400 font-sans">{subtitle}</p>}
            </div>
          </div>
          <NexusIconButton
            icon={<X className="w-4 h-4" />}
            onClick={handleClose}
            variant="ghost"
            title="Close Interface (Esc)"
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-200">{children}</div>
      </div>
    </div>
  );
};
