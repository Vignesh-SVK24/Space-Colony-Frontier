import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { AlertTriangle, Info, CheckCircle, Radio, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';

export const FloatingAlertStack: FC = () => {
  const { alerts, dismissAlert, hudVisible } = useNexusGameStore();

  if (!hudVisible || alerts.length === 0) return null;

  const typeConfig = {
    info: { border: 'border-cyan-500/40 bg-[#08131d]/90', text: 'text-cyan-300', icon: <Info className="w-4 h-4 text-cyan-400" /> },
    success: { border: 'border-emerald-500/40 bg-[#081812]/90', text: 'text-emerald-300', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
    warning: { border: 'border-amber-500/50 bg-[#1a1408]/90', text: 'text-amber-300', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    critical: { border: 'border-red-500/60 bg-[#1c080a]/95', text: 'text-red-300', icon: <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" /> },
    discovery: { border: 'border-purple-500/50 bg-[#14081c]/90', text: 'text-purple-300', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    alien: { border: 'border-yellow-500/60 bg-[#1a1708]/95', text: 'text-yellow-300', icon: <Radio className="w-4 h-4 text-yellow-400 animate-pulse" /> },
    system: { border: 'border-cyan-500/30 bg-[#080d1a]/90', text: 'text-slate-300', icon: <Info className="w-4 h-4 text-cyan-400" /> }
  };

  return (
    <div className="fixed top-16 right-3 sm:right-6 z-40 pointer-events-none flex flex-col gap-2 max-w-sm w-full font-mono select-none">
      {alerts.slice(0, 3).map((alt) => {
        const config = typeConfig[alt.type] || typeConfig.info;
        return (
          <div
            key={alt.id}
            className={clsx(
              'pointer-events-auto p-3 rounded-xs border backdrop-blur-md shadow-xl flex items-start gap-2.5 transition-all duration-300 animate-in slide-in-from-right-5',
              config.border
            )}
          >
            <span className="shrink-0 mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={clsx('text-xs font-bold uppercase tracking-wider', config.text)}>
                  {alt.title}
                </span>
                <span className="text-[9px] text-slate-500 ml-2">{alt.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed mt-0.5">
                {alt.message}
              </p>
            </div>
            <button
              onClick={() => dismissAlert(alt.id)}
              className="text-slate-400 hover:text-white transition p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
