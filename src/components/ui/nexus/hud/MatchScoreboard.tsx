import React from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { Trophy, Shield, Bot, X } from 'lucide-react';

export const MatchScoreboard: React.FC = () => {
  const isScoreboardOpen = useMultiplayerStore(state => state.isScoreboardOpen);
  const setScoreboardOpen = useMultiplayerStore(state => state.setScoreboardOpen);
  const roomCode = useMultiplayerStore(state => state.roomCode);
  const gameMode = useMultiplayerStore(state => state.gameMode);
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const selfState = useMultiplayerStore(state => state.selfState);
  const opponentState = useMultiplayerStore(state => state.opponentState);
  const otherPlayers = useMultiplayerStore(state => state.otherPlayers);
  const pingMs = useMultiplayerStore(state => state.pingMs);

  if (!isScoreboardOpen) return null;

  const allPlayers = [
    ...(selfState ? [selfState] : []),
    ...(otherPlayers.length > 0 ? otherPlayers : (opponentState ? [opponentState] : []))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#061A35]/95 border border-[#8CCDEB]/40 rounded-2xl shadow-[0_20px_60px_rgba(5,7,11,0.9)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#8CCDEB]/20 bg-[#05070B]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="text-[#FFCC00]" size={22} />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-widest uppercase">
                TACTICAL SECTOR DOSSIER
              </h2>
              <div className="text-[11px] text-[#8CCDEB]/70 font-semibold">
                SECTOR: <span className="text-[#FFCC00] font-bold">{roomCode || 'SOLO'}</span> · {gameMode === '2v2' ? '2v2 TEAM BATTLE' : gameMode === 'FFA' ? '4-PLAYER FFA' : '1v1 DUEL'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[11px] text-emerald-400 font-bold bg-black/60 px-2.5 py-1 rounded border border-emerald-500/40">
              PING: {pingMs > 0 ? `${pingMs}ms` : 'LOCAL (0ms)'}
            </div>
            <button
              onClick={() => setScoreboardOpen(false)}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-950 text-gray-400 hover:text-white border border-gray-700/60 cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Players Table */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead>
              <tr className="border-b border-[#8CCDEB]/20 text-[10px] uppercase tracking-wider text-[#8CCDEB]">
                <th className="pb-3 font-bold">Pilot</th>
                <th className="pb-3 font-bold">Team / Role</th>
                <th className="pb-3 font-bold">Hull Status</th>
                <th className="pb-3 font-bold">Health</th>
                <th className="pb-3 font-bold text-right">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {allPlayers.map((player) => {
                const isMe = selfState?.id === player.id;
                const isAlive = player.alive && player.hp > 0;
                const hpPercent = Math.max(0, Math.min(100, (player.hp / 250) * 100));

                return (
                  <tr key={player.id} className={`hover:bg-[#08264A]/30 transition-colors ${isMe ? 'bg-[#08264A]/40 font-bold' : ''}`}>
                    <td className="py-3 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: player.color === 'yellow' ? '#eab308' : player.color === 'blue' ? '#38bdf8' : player.color === 'green' ? '#22c55e' : '#ef4444'
                        }}
                      />
                      <span className={isMe ? 'text-[#FFCC00] font-black' : 'text-white'}>
                        {player.name} {isMe ? '(YOU)' : ''}
                      </span>
                    </td>
                    <td className="py-3">
                      {player.team !== 'NONE' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                          <Shield size={11} /> Team {player.team}
                        </span>
                      ) : isSolo && !isMe ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
                          <Bot size={11} /> AI Combat Drone
                        </span>
                      ) : (
                        <span className="text-gray-400">Solo Fighter</span>
                      )}
                    </td>
                    <td className="py-3 w-36">
                      <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden border border-gray-700">
                        <div
                          className={`h-full transition-all duration-300 ${!isAlive ? 'bg-gray-700' : isMe ? 'bg-[#38bdf8]' : 'bg-red-500'}`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 font-mono font-bold">
                      <span className={!isAlive ? 'text-gray-500' : player.hp > 150 ? 'text-emerald-400' : player.hp > 75 ? 'text-yellow-400' : 'text-red-400'}>
                        {Math.max(0, Math.floor(player.hp))}
                      </span>
                      <span className="text-gray-500 font-normal"> / 250</span>
                    </td>
                    <td className="py-3 text-right">
                      {isAlive ? (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
                          ELIMINATED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#8CCDEB]/20 bg-[#05070B]/80 flex items-center justify-between text-[11px] text-gray-400">
          <span>Press [TAB] or click Window to dismiss</span>
          <button
            onClick={() => setScoreboardOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[#08264A] hover:bg-[#0D3B73] text-white font-bold transition-colors cursor-pointer border border-[#8CCDEB]/30"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
