import React from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect } from '../../multiplayer/socketClient';
import { Copy, Check, Users, Bot, ArrowLeft } from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { roomCode, playerName, playerColor, opponentName, opponentColor, countdown, startSoloGame } = useMultiplayerStore();
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    disconnect();
    useMultiplayerStore.getState().reset();
  };

  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
    blue: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    red: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    green: 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#030712] flex flex-col items-center justify-center font-mono text-gray-100 p-3 sm:p-6 overflow-y-auto">
      
      <div className="max-w-md w-full bg-gray-900/90 border border-gray-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header with Room Code */}
        <div className="p-6 sm:p-8 pb-5 border-b border-gray-800 text-center">
          <p className="text-gray-400 text-[11px] sm:text-xs tracking-[0.2em] uppercase mb-3 flex items-center justify-center gap-2">
            <Users size={14} className="text-sky-400" />
            <span>Mission Room Ready</span>
          </p>
          
          <button 
            onClick={copyCode}
            className="group flex items-center justify-center gap-2 sm:gap-3 mx-auto hover:bg-gray-800/80 p-2 sm:p-3 rounded-lg transition-colors cursor-pointer"
            title="Click to Copy Code"
          >
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-sky-400 group-hover:text-sky-300 transition-colors drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              {roomCode}
            </span>
            {copied ? (
              <Check className="text-green-400 shrink-0" size={22} />
            ) : (
              <Copy className="text-gray-500 group-hover:text-sky-400 shrink-0 transition-colors" size={20} />
            )}
          </button>

          <p className="text-[10px] text-gray-500 mt-2 tracking-wider uppercase">
            {copied ? 'Code copied to clipboard!' : 'Share this 4-character code with opponent'}
          </p>
        </div>

        {/* Players Slot List */}
        <div className="p-5 sm:p-8 space-y-3.5">
          
          {/* Host / Local Player */}
          <div className="flex items-center gap-3.5 bg-gray-950/80 p-3.5 sm:p-4 rounded-lg border border-gray-800">
            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${colorMap[playerColor]}`}></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base truncate">{playerName || 'Cadet-01'}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">You (Pilot)</p>
            </div>
            <div className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Ready
            </div>
          </div>

          {/* Opponent Slot */}
          <div className={`flex items-center gap-3.5 bg-gray-950/80 p-3.5 sm:p-4 rounded-lg border ${opponentName ? 'border-gray-800' : 'border-gray-800/60 border-dashed'}`}>
            {opponentName && opponentColor ? (
              <>
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${colorMap[opponentColor]}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base truncate">{opponentName}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Opponent</p>
                </div>
                <div className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Ready
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full py-2.5 text-center">
                <p className="text-gray-400 animate-pulse tracking-widest uppercase text-xs">
                  Waiting for opponent to join...
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Connect 2nd browser window or device to join
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Action Controls & Countdown */}
        <div className="p-5 sm:p-8 pt-0 flex flex-col items-center">
          
          <div className="min-h-[50px] flex items-center justify-center mb-3">
            {countdown !== null ? (
              <div className="text-center animate-bounce">
                <p className="text-xs text-sky-400 uppercase tracking-widest mb-0.5">Engaging in</p>
                <p className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                  {countdown}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-[11px] text-center uppercase tracking-widest">
                Match launches automatically when 2nd player connects
              </p>
            )}
          </div>

          {/* Quick Option to switch to Solo Mode without waiting */}
          {!opponentName && (
            <button 
              onClick={() => {
                disconnect();
                startSoloGame();
              }}
              className="w-full py-3 px-4 mb-4 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 active:scale-[0.99] text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Bot size={16} />
              <span>Don't wait · Play Alone vs AI Drone</span>
            </button>
          )}

          <button 
            onClick={handleLeave}
            className="text-xs text-gray-400 hover:text-red-400 tracking-widest uppercase transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft size={14} />
            <span>Cancel & Return to Menu</span>
          </button>
        </div>

      </div>
    </div>
  );
};
