import { type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusPanel } from '../NexusPanel';
import { NexusButton } from '../NexusButton';
import { NexusBadge } from '../NexusStatus';
import { Crosshair } from 'lucide-react';

export const RightIntelligencePanel: FC = () => {
  const { selectedEntity, executeEntityAction, clearSelection } = useNexusGameStore();

  if (selectedEntity.type === 'none') {
    return null;
  }

  return (
    <aside className="fixed right-3 top-16 z-20 pointer-events-none font-mono">
      <div className="w-76 sm:w-84 pointer-events-auto">
        <NexusPanel
          title="TARGET INTELLIGENCE"
          subtitle={selectedEntity.type.toUpperCase()}
          headerRight={
            <NexusBadge variant="cyan">{selectedEntity.status}</NexusBadge>
          }
        >
          <div className="flex flex-col gap-3">
            {/* Target Designation */}
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-200 tracking-wider">
                  {selectedEntity.name}
                </span>
              </div>
              {selectedEntity.distanceKm !== undefined && (
                <span className="text-[10px] text-slate-400">
                  {selectedEntity.distanceKm} KM
                </span>
              )}
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-2 gap-2">
              {selectedEntity.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 p-2 rounded-xs border border-cyan-500/15 flex flex-col"
                >
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                    {m.label}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-cyan-300">{m.value}</span>
                    {m.unit && <span className="text-[9px] text-slate-400">{m.unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Tactical Actions */}
            {selectedEntity.actions.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  TACTICAL PROTOCOLS:
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedEntity.actions.map((act) => (
                    <NexusButton
                      key={act.id}
                      variant={act.variant || 'secondary'}
                      size="sm"
                      onClick={() => executeEntityAction(act.id)}
                      className="w-full"
                    >
                      {act.label}
                    </NexusButton>
                  ))}
                </div>
              </div>
            )}

            {/* Standby / Deselect */}
            <button
              onClick={clearSelection}
              className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest text-center pt-1"
            >
              DISENGAGE TARGET
            </button>
          </div>
        </NexusPanel>
      </div>
    </aside>
  );
};
