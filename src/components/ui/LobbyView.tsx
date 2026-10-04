import React, { useState } from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect, startMatch, sendSetTeam } from '../../multiplayer/colyseusClient';
import { Copy, Check, Users, Bot, ArrowLeft, Play, ShieldAlert, Sparkles } from 'lucide-react';
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
    yellow: 'bg-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.6)]',
    blue: 'bg-[#8CCDEB] shadow-[0_0_15px_rgba(140,205,235,0.6)]',
    red: 'bg-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.6)]',
    green: 'bg-[#107E57] shadow-[0_0_15px_rgba(16,126,87,0.6)]'
  };

  const borderMap: Record<BattleColor, string> = {
    yellow: 'border-[#FFCC00]/50',
    blue: 'border-[#8CCDEB]/50',
    red: 'border-[#EF4444]/50',
    green: 'border-[#107E57]/50'
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
      className="relative h-full w-full bg-[#05070B] flex flex-col items-center justify-start sm:justify-center font-mono text-[#F4F7FA] p-2 sm:p-4 md:p-6 overflow-y-auto overscroll-contain touch-pan-y scroll-touch"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      {/* 1. CINEMATIC SPACE VIDEO BACKGROUND (85-90% Visible) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={`${import.meta.env.BASE_URL}assets/video/space_poster.jpg`}
          className="w-full h-full object-cover scale-105 filter brightness-105 contrast-105"
        >
          <source src={`${import.meta.env.BASE_URL}assets/video/gemini_generated_video_2973b38a.mp4`} type="video/mp4" />
        </video>

        {/* Minimal layered dark navy gradient - preserving video visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070B]/80 via-[#061A35]/50 to-[#05070B]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#061A35]/30 to-[#05070B]/75 pointer-events-none" />
      </div>

      {/* 2. MAIN LOBBY BRIEFING CARD */}
      <div className="relative z-10 max-w-lg w-full bg-[#061A35]/85 border border-[#8CCDEB]/30 rounded-2xl shadow-[0_20px_60px_rgba(5,7,11,0.85)] backdrop-blur-xl flex flex-col my-auto max-h-[calc(100%-1rem)] sm:max-h-[92vh] overflow-hidden">
        
        {/* Top Header with Room Code & Navigation */}
        <div className="p-3.5 sm:p-5 pb-3 border-b border-[#8CCDEB]/20 text-center shrink-0 bg-[#05070B]/40">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#05070B]/60 hover:bg-[#08264A] text-[11px] text-[#8CCDEB] hover:text-[#F4F7FA] uppercase tracking-wider cursor-pointer transition-colors border border-[#8CCDEB]/20"
            >
              <ArrowLeft size={13} />
              <span>Leave</span>
            </button>
            
            <div className="flex items-center gap-2">
              <img 
                src={`${import.meta.env.BASE_URL}app-icon.png`} 
                alt="Emblem" 
                className="w-5 h-5 rounded border border-[#8CCDEB]/40 object-cover shadow-sm" 
              />
              <p className="text-[#8CCDEB] text-[10px] sm:text-xs tracking-[0.18em] uppercase font-bold flex items-center gap-1.5">
                <Users size={13} className="text-[#8CCDEB]" />
                <span>
                  {gameMode === '2v2' ? '2v2 Squad Strike Lobby' : gameMode === 'FFA' ? '4-Player FFA Sector' : '1v1 Orbital Duel'}
                </span>
              </p>
            </div>

            <div className="w-12 text-right">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#107E57]/30 border border-[#107E57]/60 text-[#22c55e] font-bold uppercase tracking-wider">
                LIVE
              </span>
            </div>
          </div>
          
          {/* Room Code Display */}
          <div className="mt-1">
            <p className="text-[9px] text-[#8CCDEB]/70 tracking-widest uppercase mb-1">
              Encrypted Sector Key
            </p>
            <button 
              onClick={copyCode}
              className="group flex items-center justify-center gap-2.5 mx-auto bg-[#05070B]/60 hover:bg-[#08264A]/80 border border-[#8CCDEB]/30 hover:border-[#FFCC00]/50 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(140,205,235,0.15)]"
              title="Click to Copy Room Code"
            >
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-widest text-[#FFCC00] group-hover:text-[#FFB000] transition-colors drop-shadow-[0_0_15px_rgba(255,204,0,0.4)]">
                {roomCode}
              </span>
              {copied ? (
                <Check className="text-[#22c55e] shrink-0" size={20} />
              ) : (
                <Copy className="text-[#8CCDEB] group-hover:text-[#FFCC00] shrink-0 transition-colors" size={18} />
              )}
            </button>
          </div>

          <p className="text-[10px] text-[#8CCDEB]/80 mt-2 tracking-wider uppercase">
            {copied ? (
              <span className="text-[#22c55e] font-bold">Key copied to comms clipboard!</span>
            ) : (
              <span>Share key with squad pilots ({playerCount}/{maxSlots} Connected)</span>
            )}
          </p>
        </div>

        {/* Player Slot List - independently scrollable on mobile and short screens */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-2.5 touch-pan-y scroll-touch bg-[#05070B]/20"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {slots.map((pilot, idx) => {
            const slotIndex = idx + 1;
            const isMe = pilot?.id === playerId;

            if (pilot) {
              return (
                <div 
                  key={pilot.id || idx}
                  className={`flex items-center gap-2.5 sm:gap-3 bg-[#08264A]/75 p-2.5 sm:p-3 rounded-xl border ${borderMap[pilot.color as BattleColor] || 'border-[#8CCDEB]/30'} shadow-[0_4px_12px_rgba(5,7,11,0.5)] transition-all`}
                >
                  <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 ${colorMap[pilot.color as BattleColor] || 'bg-[#8CCDEB]'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs sm:text-sm md:text-base truncate text-[#F4F7FA]">{pilot.name}</p>
                      {isMe && (
                        <span className="text-[9px] bg-[#8CCDEB]/20 text-[#8CCDEB] border border-[#8CCDEB]/50 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-[#8CCDEB]/70 uppercase tracking-widest truncate">
                      Slot {slotIndex} · {pilot.isHost ? 'Flight Commander' : `Wingman-${slotIndex}`}
                      {gameMode === '2v2' && (
                        <span className="ml-1.5 font-bold text-[#FFCC00]">Team {pilot.team || (slotIndex <= 2 ? 'A' : 'B')}</span>
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
                      className="px-2 py-1 text-[10px] bg-[#05070B]/80 hover:bg-[#061A35] text-[#8CCDEB] rounded border border-[#8CCDEB]/40 font-bold uppercase tracking-wider cursor-pointer shrink-0 transition-colors"
                    >
                      Switch Team
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {pilot.isHost && (
                      <span className="text-[9px] bg-[#FFB000]/20 text-[#FFCC00] border border-[#FFCC00]/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        HOST
                      </span>
                    )}
                    <div className="text-[9px] sm:text-[10px] bg-[#107E57]/30 text-[#22c55e] border border-[#107E57]/60 px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Ready
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={`empty_${slotIndex}`}
                className="flex items-center justify-between gap-2.5 sm:gap-3 bg-[#05070B]/40 p-2.5 sm:p-3 rounded-xl border border-dashed border-[#8CCDEB]/25 text-[#8CCDEB]/50"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-3.5 h-3.5 rounded-full border border-[#8CCDEB]/30 bg-[#061A35]/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-[#8CCDEB]/70 uppercase tracking-wider truncate">
                      Slot {slotIndex} · Open Telemetry Slot
                    </p>
                    <p className="text-[9px] text-[#8CCDEB]/50 truncate">Awaiting wingman code <span className="text-[#FFCC00] font-bold">{roomCode}</span></p>
                  </div>
                </div>
                <span className="text-[9px] text-[#8CCDEB]/60 uppercase tracking-widest animate-pulse shrink-0">
                  Scanning...
                </span>
              </div>
            );
          })}
        </div>

        {/* Docked Action Controls & Start Button - Always visible and pinned at bottom */}
        <div className="p-3 sm:p-5 border-t border-[#8CCDEB]/20 bg-[#05070B]/85 backdrop-blur-md shrink-0 flex flex-col items-center z-10 shadow-lg">
          <div className="min-h-[30px] sm:min-h-[38px] flex items-center justify-center mb-2.5 text-center">
            {countdown !== null ? (
              <div className="text-center animate-bounce">
                <p className="text-[10px] sm:text-xs text-[#8CCDEB] uppercase tracking-widest mb-0.5 font-bold">Warp Engines Engaging In</p>
                <p className="text-4xl sm:text-5xl font-black text-[#FFCC00] drop-shadow-[0_0_20px_rgba(255,204,0,0.6)]">
                  {countdown}
                </p>
              </div>
            ) : canLaunch ? (
              <p className="text-[#22c55e] text-[11px] sm:text-xs text-center uppercase tracking-widest font-bold animate-pulse flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#FFCC00]" />
                <span>
                  {playerCount === maxSlots 
                    ? 'All pilots linked! Click Launch Battle to engage!' 
                    : `${playerCount}/${maxSlots} pilots synced. Ready for combat!`}
                </span>
              </p>
            ) : (
              <p className="text-[#8CCDEB]/70 text-[11px] sm:text-xs text-center uppercase tracking-widest animate-pulse">
                Awaiting squad link via key <span className="text-[#FFCC00] font-bold">{roomCode}</span> ({playerCount}/{maxSlots})
              </p>
            )}
          </div>

          {/* Launch Battle Button - Visible to all pilots once at least 2 players have joined! */}
          {canLaunch && (
            <button
              onClick={handleLaunchBattle}
              className="w-full py-3.5 px-5 mb-2.5 bg-gradient-to-r from-[#0D3B73] via-[#0A2850] to-[#061A35] hover:from-[#1677FF] hover:to-[#0D3B73] active:scale-[0.99] border-2 border-[#8CCDEB] hover:border-[#FFCC00] text-[#F4F7FA] rounded-xl text-xs sm:text-sm md:text-base font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_25px_rgba(140,205,235,0.4)] hover:shadow-[0_0_30px_rgba(255,204,0,0.5)] animate-pulse"
            >
              <Play size={18} fill="currentColor" className="text-[#FFCC00]" />
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
              className="w-full py-2.5 px-4 bg-[#061A35]/70 border border-[#8CCDEB]/30 hover:border-[#8CCDEB] hover:bg-[#08264A] active:scale-[0.99] text-[#8CCDEB] hover:text-[#F4F7FA] rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(140,205,235,0.15)]"
            >
              <Bot size={15} className="text-[#8CCDEB]" />
              <span>Launch Solo vs AI Drone (Offline Practice)</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

