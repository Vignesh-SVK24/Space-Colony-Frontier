import { useState, useEffect, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusPanel } from '../NexusPanel';
import { NexusProgress } from '../NexusProgress';
import { NexusBadge } from '../NexusStatus';
import { ChevronRight, CheckCircle2, Circle, X, Target } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const LeftOperationsPanel: FC = () => {
  // Default collapsed to keep the gaming screen clean and attractive
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'mission' | 'alerts'>('mission');
  const { missions, activeMissionId, alerts, dismissAlert, hudVisible } = useNexusGameStore();

  const activeMission = missions.find((m) => m.id === activeMissionId) || missions[0];

  const toggleCollapse = () => {
    nexusAudio.playClick(1000);
    setCollapsed(!collapsed);
  };

  // Keyboard shortcut 'O' to toggle operations
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key.toUpperCase() === 'O') {
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [collapsed]);

  if (!hudVisible) return null;

  return (
    <aside className="fixed left-3 top-14 z-20 pointer-events-none font-mono transition-all duration-300">
      <div className="pointer-events-auto flex items-start gap-1">
        {/* Collapsed State: Sleek Gaming Objective Pill */}
        {collapsed && activeMission && (
          <button
            onClick={toggleCollapse}
            title="Open Directives & Intel (O)"
            className="flex items-center gap-2 bg-[#080d1a]/85 hover:bg-[#0c1527]/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition cursor-pointer group"
          >
            <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="text-[10px] text-cyan-400/90 font-bold uppercase tracking-wider">OBJ:</span>
            <span className="text-[11px] font-semibold text-slate-100 group-hover:text-cyan-200 transition truncate max-w-[150px] sm:max-w-[200px]">
              {activeMission.title}
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              {activeMission.progress}%
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        )}

        {/* Expanded State: Full Tactical Directives Console */}
        {!collapsed && (
          <div className="w-76 sm:w-84 flex flex-col gap-2">
            <NexusPanel
              title="OPERATIONS COMMAND"
              subtitle="TACTICAL MISSIONS & LOGS"
              headerRight={
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded border border-cyan-500/20">
                    <button
                      onClick={() => setActiveTab('mission')}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition cursor-pointer ${activeTab === 'mission' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      MISSION
                    </button>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition cursor-pointer ${activeTab === 'alerts' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      LOG ({alerts.length})
                    </button>
                  </div>
                  <button
                    onClick={toggleCollapse}
                    title="Minimize (O)"
                    className="p-1 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            >
              {activeTab === 'mission' && activeMission && (
                <div className="flex flex-col gap-3">
                  {/* Mission ID & Title */}
                  <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2">
                    <div className="flex items-center gap-2">
                      <NexusBadge variant="cyan">{activeMission.id}</NexusBadge>
                      <h4 className="text-xs font-bold text-cyan-200 tracking-wider">
                        {activeMission.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {activeMission.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <NexusProgress value={activeMission.progress} color="cyan" size="sm" />

                  {/* Briefing */}
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {activeMission.description}
                  </p>

                  {/* Objectives Checklist */}
                  <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2 rounded-xs border border-cyan-500/10">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      CURRENT DIRECTIVES:
                    </span>
                    {activeMission.objectives.map((obj) => (
                      <div key={obj.id} className="flex items-start gap-1.5 text-[11px]">
                        {obj.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <span className={obj.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                          {obj.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reward Pill */}
                  <div className="flex items-center justify-between text-[10px] bg-cyan-950/30 px-2 py-1 rounded-xs border border-cyan-500/20 text-cyan-300">
                    <span className="text-slate-400 uppercase">REWARD:</span>
                    <span className="font-bold truncate ml-2">{activeMission.reward}</span>
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">NO ACTIVE ALERTS</div>
                  ) : (
                    alerts.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-2 bg-slate-950/70 border border-cyan-500/15 rounded-xs flex flex-col gap-1 text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-cyan-400 font-bold tracking-wider">
                            [{alt.type.toUpperCase()}] {alt.timestamp}
                          </span>
                          <button
                            onClick={() => dismissAlert(alt.id)}
                            className="text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            DISMISS
                          </button>
                        </div>
                        <div className="font-bold text-slate-200">{alt.title}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{alt.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </NexusPanel>
          </div>
        )}
      </div>
    </aside>
  );
};
