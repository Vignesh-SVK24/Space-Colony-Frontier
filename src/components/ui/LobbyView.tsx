import React, { useState } from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect, startMatch, sendSetTeam } from '../../multiplayer/colyseusClient';
import { Copy, Check, Users, Bot, ArrowLeft, Play } from 'lucide-react';
import { BattleColor, Team } from '../../multiplayer/types';

export const LobbyView: React.FC = () => {
  const {
    roomCode,
    playerName,
    playerColor,
    playerId,
    isHost,
    roomPlayers,
    otherPlayers,
    countdown,
    gameMode,
    startSoloGame
  } = useMultiplayerStore();

  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    disconnect();
    useMultiplayerStore.getState().reset();
  };

  const handleLaunchBattle = () => {
    startMatch();
  };

  const colorMap: Record<BattleColor, string> = {
    yellow: 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
    blue: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    red: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    green: 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
  };

  const borderMap: Record<BattleColor, string> = {
    yellow: 'border-yellow-500/40',
    blue: 'border-blue-500/40',
    red: 'border-red-500/40',
    green: 'border-green-500/40'
  };

  const maxSlots = gameMode === '1v1' ? 2 : 4;
  const effectivePlayers = roomPlayers.length > 0 ? roomPlayers : [
    {
      id: playerId || 'self',
      name: playerName || 'Host Pilot',
      color: playerColor,
      team: (gameMode === '2v2' ? 'A' : 'NONE') as Team,
      isHost: isHost,
      slot: 1,
      ready: true
    }
  ];

  const slots = Array.from({ length: maxSlots }, (_, i) => i + 1).map(slotNum => {
    return effectivePlayers.find(p => p.slot === slotNum) || null;
  });

  // Calculate live player count from both roomPlayers and otherPlayers to never miss a join
  const playerCount = Math.max(effectivePlayers.length, (otherPlayers?.length || 0) + 1);
  const minRequired = 2;
  // Any connected pilot can launch the match once at least 2 players are in the room!
  const canLaunch = playerCount >= minRequired && countdown === null;

  return (
    <div 
      className="h-full w-full bg-[#030712] flex flex-col items-center justify-start sm:justify-center font-mono text-gray-100 p-2 sm:p-4 md:p-6 overflow-y-auto overscroll-contain touch-pan-y scroll-touch"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      
      <div className="max-w-lg w-full bg-gray-900/90 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md flex flex-col my-auto max-h-[calc(100%-1rem)] sm:max-h-[92vh] overflow-hidden">
        
        {/* Header with Room Code - shrink-0 to stay pinned at top */}
        <div className="p-3.5 sm:p-5 pb-3 border-b border-gray-800 text-center shrink-0">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <button
              onClick={handleLeave}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white uppercase tracking-wider cursor-pointer transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Leave</span>
            </button>
            <p className="text-gray-400 text-[10px] sm:text-xs tracking-[0.15em] uppercase flex items-center gap-1.5">
              <Users size={13} className="text-sky-400" />
              <span>
                {gameMode === '2v2' ? '2v2 Team Battle Lobby' : gameMode === 'FFA' ? '4-Player FFA Lobby' : '1v1 Duel Lobby'}
              </span>
            </p>
            <div className="w-10" />
          </div>
          
          <button 
            onClick={copyCode}
            className="group flex items-center justify-center gap-2 sm:gap-3 mx-auto hover:bg-gray-800/80 p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer"
            title="Click to Copy Room Code"
          >
            <span className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-widest text-sky-400 group-hover:text-sky-300 transition-colors drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              {roomCode}
            </span>
            {copied ? (
              <Check className="text-green-400 shrink-0" size={20} />
            ) : (
              <Copy className="text-gray-500 group-hover:text-sky-400 shrink-0 transition-colors" size={18} />
            )}
          </button>

          <p className="text-[10px] text-gray-400 mt-1 tracking-wider uppercase">
            {copied ? 'Code copied to clipboard!' : `Share code with friends (${playerCount}/${maxSlots} Connected)`}
          </p>
        </div>

        {/* Player Slot List - independently scrollable on mobile and short screens */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-2 touch-pan-y scroll-touch"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {slots.map((pilot, idx) => {
            const slotIndex = idx + 1;
            const isMe = pilot?.id === playerId;

            if (pilot) {
              return (
                <div 
                  key={pilot.id || idx}
                  className={`flex items-center gap-2.5 sm:gap-3 bg-gray-950/80 p-2.5 sm:p-3 rounded-lg border ${borderMap[pilot.color as BattleColor] || 'border-gray-800'}`}
                >
                  <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 ${colorMap[pilot.color as BattleColor] || 'bg-sky-500'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs sm:text-sm md:text-base truncate text-white">{pilot.name}</p>
                      {isMe && (
                        <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest truncate">
                      Slot {slotIndex} · {pilot.isHost ? 'Host Pilot' : `Pilot-${slotIndex}`}
                      {gameMode === '2v2' && (
                        <span className="ml-1.5 font-bold text-cyan-400">Team {pilot.team || (slotIndex <= 2 ? 'A' : 'B')}</span>
                      )}
                    </p>
                  </div>

                  {/* Team Switcher in 2v2 Mode */}
                  {gameMode === '2v2' && isMe && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextTeam: Team = (pilot.team === 'A' ? 'B' : 'A');
                        sendSetTeam(nextTeam);
                      }}
                      className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-sky-300 rounded border border-gray-700 font-bold uppercase tracking-wider cursor-pointer shrink-0"
                    >
                      Switch Team
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {pilot.isHost && (
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        HOST
                      </span>
                    )}
                    <div className="text-[9px] sm:text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Ready
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={`empty_${slotIndex}`}
                className="flex items-center justify-between gap-2.5 sm:gap-3 bg-gray-950/40 p-2.5 sm:p-3 rounded-lg border border-dashed border-gray-800/80 text-gray-600"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-700 bg-gray-900 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider truncate">
                      Slot {slotIndex} · Open Pilot Slot
                    </p>
                    <p className="text-[9px] text-gray-600 truncate">Enter code <span className="text-gray-400 font-bold">{roomCode}</span> to join</p>
                  </div>
                </div>
                <span className="text-[9px] text-gray-600 uppercase tracking-widest animate-pulse shrink-0">
                  Waiting...
                </span>
              </div>
            );
          })}
        </div>

        {/* Docked Action Controls & Start Button - Always visible and pinned at bottom */}
        <div className="p-3 sm:p-5 border-t border-gray-800/80 bg-gray-950/95 backdrop-blur-md shrink-0 flex flex-col items-center z-10 shadow-lg">
          <div className="min-h-[30px] sm:min-h-[38px] flex items-center justify-center mb-2 sm:mb-2.5 text-center">
            {countdown !== null ? (
              <div className="text-center animate-bounce">
                <p className="text-[10px] sm:text-xs text-sky-400 uppercase tracking-widest mb-0.5">Engaging in</p>
                <p className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                  {countdown}
                </p>
              </div>
            ) : canLaunch ? (
              <p className="text-emerald-400 text-[11px] sm:text-xs text-center uppercase tracking-widest font-bold animate-pulse">
                {playerCount === maxSlots 
                  ? 'All pilots connected! Click Launch Battle to start!' 
                  : `${playerCount}/${maxSlots} pilots connected. Ready to start!`}
              </p>
            ) : (
              <p className="text-gray-400 text-[11px] sm:text-xs text-center uppercase tracking-widest animate-pulse">
                Waiting for other members to join with code <span className="text-sky-400 font-bold">{roomCode}</span> ({playerCount}/{maxSlots})
              </p>
            )}
          </div>

          {/* Launch Battle Button - Visible to all pilots once at least 2 players have joined! */}
          {canLaunch && (
            <button
              onClick={handleLaunchBattle}
              className="w-full py-3 sm:py-3.5 px-4 mb-2 sm:mb-2.5 bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 active:scale-[0.99] text-white rounded-lg text-xs sm:text-sm md:text-base font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(56,189,248,0.4)] animate-pulse"
            >
              <Play size={18} fill="currentColor" />
              <span>Launch Battle ({playerCount}/{maxSlots} Pilots)</span>
            </button>
          )}

          {/* Switch to Solo Mode if waiting alone */}
          {playerCount === 1 && (
            <button 
              onClick={() => {
                disconnect();
                startSoloGame();
              }}
              className="w-full py-2 sm:py-2.5 px-4 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 active:scale-[0.99] text-emerald-300 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Bot size={15} />
              <span>Play Solo vs AI Drone (Offline)</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
