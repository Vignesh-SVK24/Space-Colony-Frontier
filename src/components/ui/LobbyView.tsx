import React, { useState } from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect, startMatch, sendSetTeam } from '../../multiplayer/colyseusClient';
import { Copy, Check, Users, Bot, ArrowLeft, Play, Sparkles } from 'lucide-react';
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
    yellow: 'bg-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.6)] ring-2 ring-[#FFCC00]/50',
    blue: 'bg-[#8CCDEB] shadow-[0_0_15px_rgba(140,205,235,0.6)] ring-2 ring-[#8CCDEB]/50',
    red: 'bg-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.6)] ring-2 ring-[#EF4444]/50',
    green: 'bg-[#107E57] shadow-[0_0_15px_rgba(16,126,87,0.6)] ring-2 ring-[#107E57]/50'
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

  const playerCount = Math.max(effectivePlayers.length, (otherPlayers?.length || 0) + 1);
  const minRequired = 2;
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

        <div className="absolute inset-0 bg-gradient-to-b from-[#05070B]/80 via-[#061A35]/50 to-[#05070B]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#061A35]/30 to-[#05070B]/75 pointer-events-none" />
      </div>

      {/* 2. MAIN LOBBY BRIEFING CARD */}
      <div className="relative z-10 max-w-xl w-full bg-[#061A35]/90 border border-[#8CCDEB]/35 rounded-2xl shadow-[0_20px_60px_rgba(5,7,11,0.9)] backdrop-blur-xl flex flex-col my-auto max-h-[calc(100%-1rem)] sm:max-h-[94vh] overflow-hidden">
        
        {/* COMPACT HEADER (Room Code compromised in size to give maximum space to the player list) */}
        <div className="p-3 sm:p-4 pb-2.5 border-b border-[#8CCDEB]/20 shrink-0 bg-[#05070B]/50">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleLeave}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#05070B]/80 hover:bg-[#08264A] text-[11px] text-[#8CCDEB] hover:text-[#F4F7FA] uppercase tracking-wider cursor-pointer transition-colors border border-[#8CCDEB]/20 shrink-0"
            >
              <ArrowLeft size={13} />
              <span>Leave</span>
            </button>
            
            {/* Compact Sector Key Display */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#8CCDEB]/80 hidden sm:inline">SECTOR KEY:</span>
              <button 
                onClick={copyCode}
                className="group flex items-center gap-1.5 bg-[#05070B]/80 hover:bg-[#08264A] border border-[#8CCDEB]/40 hover:border-[#FFCC00] px-3 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                title="Click to copy sector key"
              >
                <span className="text-base sm:text-xl font-black tracking-widest text-[#FFCC00] group-hover:text-[#FFB000]">
                  {roomCode}
                </span>
                {copied ? (
                  <Check className="text-[#22c55e] shrink-0" size={14} />
                ) : (
                  <Copy className="text-[#8CCDEB] group-hover:text-[#FFCC00] shrink-0 transition-colors" size={13} />
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] px-2 py-0.5 rounded bg-[#107E57]/30 border border-[#107E57]/60 text-[#22c55e] font-black uppercase tracking-wider">
                {playerCount}/{maxSlots} PILOTS
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1 text-[10px] text-[#8CCDEB]/70 font-mono">
            <span className="uppercase tracking-wider">
              {gameMode === '2v2' ? '2v2 Squad Strike' : gameMode === 'FFA' ? '4-Player FFA Sector' : '1v1 Orbital Duel'}
            </span>
            {copied && <span className="text-[#22c55e] font-bold">Key copied to comms!</span>}
          </div>
        </div>

        {/* EXPANDED CONNECTED PLAYER LIST - Larger, more prominent slot size */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3 touch-pan-y scroll-touch bg-[#05070B]/25"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {slots.map((pilot, idx) => {
            const slotIndex = idx + 1;
            const isMe = pilot?.id === playerId;

            if (pilot) {
              return (
                <div 
                  key={pilot.id || idx}
                  className={`flex items-center gap-3 sm:gap-4 bg-[#08264A]/85 p-3.5 sm:p-4 rounded-xl border-2 ${borderMap[pilot.color as BattleColor] || 'border-[#8CCDEB]/40'} shadow-[0_6px_16px_rgba(5,7,11,0.6)] transition-all`}
                >
                  {/* Larger Ship Chassis Indicator Orb */}
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0 ${colorMap[pilot.color as BattleColor] || 'bg-[#8CCDEB]'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm sm:text-base md:text-lg truncate text-white">{pilot.name}</p>
                      {isMe && (
                        <span className="text-[10px] bg-[#8CCDEB]/25 text-[#8CCDEB] border border-[#8CCDEB]/60 px-2 py-0.5 rounded font-black uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#8CCDEB]/80 uppercase tracking-wider font-mono truncate mt-0.5">
                      Slot {slotIndex} · {pilot.isHost ? 'Flight Commander' : `Wingman-${slotIndex}`}
                      {gameMode === '2v2' && (
                        <span className="ml-2 font-bold text-[#FFCC00]">Team {pilot.team || (slotIndex <= 2 ? 'A' : 'B')}</span>
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
                      className="px-2.5 py-1 text-xs bg-[#05070B] hover:bg-[#061A35] text-[#8CCDEB] rounded-lg border border-[#8CCDEB]/40 font-bold uppercase tracking-wider cursor-pointer shrink-0 transition-colors"
                    >
                      Switch Team
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {pilot.isHost && (
                      <span className="text-[10px] sm:text-xs bg-[#FFB000]/25 text-[#FFCC00] border border-[#FFCC00]/60 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        HOST
                      </span>
                    )}
                    <div className="text-[10px] sm:text-xs bg-[#107E57]/35 text-[#22c55e] border border-[#107E57]/70 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                      Ready
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={`empty_${slotIndex}`}
                className="flex items-center justify-between gap-3 sm:gap-4 bg-[#05070B]/50 p-3.5 sm:p-4 rounded-xl border-2 border-dashed border-[#8CCDEB]/30 text-[#8CCDEB]/60"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#8CCDEB]/40 bg-[#061A35]/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#8CCDEB]/80 uppercase tracking-wider truncate">
                      Slot {slotIndex} · Open Pilot Slot
                    </p>
                    <p className="text-[10px] text-[#8CCDEB]/50 truncate">Waiting for wingman connection...</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#8CCDEB]/60 uppercase tracking-widest animate-pulse shrink-0 font-bold">
                  Open
                </span>
              </div>
            );
          })}
        </div>

        {/* DOCKED ACTION CONTROLS & START BUTTON (No unwanted 'awaiting squad link via key' text) */}
        <div className="p-3 sm:p-4 border-t border-[#8CCDEB]/20 bg-[#05070B]/90 backdrop-blur-md shrink-0 flex flex-col items-center z-10 shadow-lg">
          <div className="min-h-[26px] sm:min-h-[32px] flex items-center justify-center mb-2 text-center">
            {countdown !== null ? (
              <div className="text-center animate-bounce">
                <p className="text-[10px] text-[#8CCDEB] uppercase tracking-widest mb-0.5 font-bold">Warp Engines Engaging In</p>
                <p className="text-3xl sm:text-4xl font-black text-[#FFCC00] drop-shadow-[0_0_20px_rgba(255,204,0,0.6)]">
                  {countdown}
                </p>
              </div>
            ) : canLaunch ? (
              <p className="text-[#22c55e] text-xs sm:text-sm text-center uppercase tracking-widest font-bold animate-pulse flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#FFCC00]" />
                <span>
                  {playerCount === maxSlots 
                    ? 'All pilots linked! Click Launch Battle to engage!' 
                    : `${playerCount}/${maxSlots} pilots synced. Ready for combat!`}
                </span>
              </p>
            ) : (
              <p className="text-[#8CCDEB]/70 text-xs text-center uppercase tracking-wider font-semibold">
                Waiting for pilots to connect... ({playerCount}/{maxSlots})
              </p>
            )}
          </div>

          {/* Launch Battle Button */}
          {canLaunch && (
            <button
              onClick={handleLaunchBattle}
              className="w-full py-3.5 px-5 mb-2 bg-gradient-to-r from-[#0D3B73] via-[#0A2850] to-[#061A35] hover:from-[#1677FF] hover:to-[#0D3B73] active:scale-[0.99] border-2 border-[#8CCDEB] hover:border-[#FFCC00] text-[#F4F7FA] rounded-xl text-xs sm:text-sm md:text-base font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(140,205,235,0.4)] hover:shadow-[0_0_30px_rgba(255,204,0,0.5)] animate-pulse"
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
