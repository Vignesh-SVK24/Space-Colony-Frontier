import React, { useState } from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect, startMatch, updateServerUrl } from '../../multiplayer/socketClient';
import { Copy, Check, Users, Bot, ArrowLeft, Play, Server, Edit2 } from 'lucide-react';
import { BattleColor } from '../../multiplayer/types';

export const LobbyView: React.FC = () => {
  const {
    roomCode,
    playerName,
    playerColor,
    playerId,
    isHost,
    roomPlayers,
    countdown,
    serverUrl,
    startSoloGame
  } = useMultiplayerStore();

  const [copied, setCopied] = useState(false);
  const [editingServer, setEditingServer] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    disconnect();
    useMultiplayerStore.getState().reset();
  };

  const handleLaunchBattle = () => {
    startMatch();
  };

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (customServerUrl.trim()) {
      updateServerUrl(customServerUrl.trim());
      setEditingServer(false);
    }
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

  // Compile full 4 slots
  const effectivePlayers = roomPlayers.length > 0 ? roomPlayers : [
    {
      id: playerId || 'self',
      name: playerName || 'Host Pilot',
      color: playerColor,
      isHost: isHost,
      slot: 1,
      ready: true
    }
  ];

  const slots = [1, 2, 3, 4].map(slotNum => {
    return effectivePlayers.find(p => p.slot === slotNum) || null;
  });

  const playerCount = effectivePlayers.length;
  const canLaunch = isHost && playerCount >= 2 && countdown === null;

  return (
    <div className="min-h-[100dvh] w-full bg-[#030712] flex flex-col items-center justify-center font-mono text-gray-100 p-3 sm:p-6 overflow-y-auto">
      
      <div className="max-w-lg w-full bg-gray-900/90 border border-gray-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header with Room Code */}
        <div className="p-5 sm:p-7 pb-4 border-b border-gray-800 text-center">
          <p className="text-gray-400 text-[11px] sm:text-xs tracking-[0.2em] uppercase mb-2 flex items-center justify-center gap-2">
            <Users size={14} className="text-sky-400" />
            <span>4-Player Battle Lobby</span>
          </p>
          
          <button 
            onClick={copyCode}
            className="group flex items-center justify-center gap-2 sm:gap-3 mx-auto hover:bg-gray-800/80 p-2 sm:p-2.5 rounded-lg transition-colors cursor-pointer"
            title="Click to Copy Room Code"
          >
            <span className="text-3xl sm:text-5xl font-black tracking-widest text-sky-400 group-hover:text-sky-300 transition-colors drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              {roomCode}
            </span>
            {copied ? (
              <Check className="text-green-400 shrink-0" size={22} />
            ) : (
              <Copy className="text-gray-500 group-hover:text-sky-400 shrink-0 transition-colors" size={20} />
            )}
          </button>

          <p className="text-[10px] text-gray-500 mt-1.5 tracking-wider uppercase">
            {copied ? 'Code copied to clipboard!' : `Share this room code with up to 3 pilots (${playerCount}/4 Connected)`}
          </p>
        </div>

        {/* 4-Player Slot List */}
        <div className="p-4 sm:p-6 space-y-2.5">
          {slots.map((pilot, idx) => {
            const slotIndex = idx + 1;
            const isMe = pilot?.id === playerId;

            if (pilot) {
              return (
                <div 
                  key={pilot.id || idx}
                  className={`flex items-center gap-3 bg-gray-950/80 p-3 sm:p-3.5 rounded-lg border ${borderMap[pilot.color as BattleColor] || 'border-gray-800'}`}
                >
                  <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${colorMap[pilot.color as BattleColor] || 'bg-sky-500'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm sm:text-base truncate text-white">{pilot.name}</p>
                      {isMe && (
                        <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Slot {slotIndex} · {pilot.isHost ? 'Host Pilot' : `Pilot-${slotIndex}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pilot.isHost && (
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        HOST
                      </span>
                    )}
                    <div className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Ready
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={`empty_${slotIndex}`}
                className="flex items-center justify-between gap-3 bg-gray-950/40 p-3 sm:p-3.5 rounded-lg border border-dashed border-gray-800/80 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-700 bg-gray-900" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Slot {slotIndex} · Open Pilot Slot
                    </p>
                    <p className="text-[9px] text-gray-600">Enter code <span className="text-gray-400 font-bold">{roomCode}</span> to join</p>
                  </div>
                </div>
                <span className="text-[9px] text-gray-600 uppercase tracking-widest animate-pulse">
                  Waiting...
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Controls & Countdown */}
        <div className="p-4 sm:p-6 pt-0 flex flex-col items-center">
          
          {/* Countdown Display */}
          <div className="min-h-[50px] flex items-center justify-center mb-3">
            {countdown !== null ? (
              <div className="text-center animate-bounce">
                <p className="text-xs text-sky-400 uppercase tracking-widest mb-0.5">Engaging in</p>
                <p className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                  {countdown}
                </p>
              </div>
            ) : isHost ? (
              canLaunch ? (
                <p className="text-emerald-400 text-[11px] text-center uppercase tracking-widest font-semibold">
                  {playerCount === 4 
                    ? 'Lobby full! Battle starting...' 
                    : `${playerCount}/4 pilots connected. Ready to launch or wait for more pilots!`}
                </p>
              ) : (
                <p className="text-gray-400 text-[11px] text-center uppercase tracking-widest animate-pulse">
                  Waiting for at least 1 more pilot to connect... (2 to 4 players)
                </p>
              )
            ) : (
              <p className="text-sky-300 text-[11px] text-center uppercase tracking-widest animate-pulse">
                Waiting for Host to launch the battle ({playerCount}/4 pilots connected)...
              </p>
            )}
          </div>

          {/* Host Launch Battle Button */}
          {canLaunch && (
            <button
              onClick={handleLaunchBattle}
              className="w-full py-3.5 px-4 mb-3.5 bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 active:scale-[0.99] text-white rounded-lg text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(56,189,248,0.4)]"
            >
              <Play size={18} fill="currentColor" />
              <span>Launch Battle ({playerCount}/4 Pilots)</span>
            </button>
          )}

          {/* Option to switch to Solo Mode if waiting */}
          {playerCount === 1 && (
            <button 
              onClick={() => {
                disconnect();
                startSoloGame();
              }}
              className="w-full py-2.5 px-4 mb-3 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 active:scale-[0.99] text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Bot size={16} />
              <span>Don't wait · Play Solo vs AI Drone</span>
            </button>
          )}

          {/* Server Connection Bar */}
          <div className="w-full mb-3 px-3 py-1.5 bg-gray-950/70 border border-gray-800 rounded-lg flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-gray-400 truncate">
              <Server size={12} className="text-sky-400 shrink-0" />
              <span className="truncate">Server: <span className="text-gray-300">{serverUrl}</span></span>
            </div>
            <button
              onClick={() => setEditingServer(!editingServer)}
              className="text-sky-400 hover:text-sky-300 uppercase tracking-wider font-bold ml-2 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Edit2 size={10} />
              <span>{editingServer ? 'Close' : 'Change'}</span>
            </button>
          </div>

          {editingServer && (
            <form onSubmit={handleSaveServer} className="w-full mb-3 flex gap-2">
              <input
                type="text"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                placeholder="http://192.168.x.x:3001"
                className="flex-1 bg-gray-950 border border-gray-700 text-xs px-2.5 py-1.5 rounded text-white font-mono focus:border-sky-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer"
              >
                Save
              </button>
            </form>
          )}

          {/* Return to Menu */}
          <button 
            onClick={handleLeave}
            className="text-xs text-gray-400 hover:text-red-400 tracking-widest uppercase transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft size={14} />
            <span>Leave Lobby & Return to Menu</span>
          </button>
        </div>

      </div>
    </div>
  );
};
