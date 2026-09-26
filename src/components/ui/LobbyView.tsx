import React from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect } from '../../multiplayer/socketClient';
import { Copy, Check, Users } from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { roomCode, playerName, playerColor, opponentName, opponentColor, countdown } = useMultiplayerStore();
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
    <div className="h-screen w-full bg-gray-950 flex flex-col items-center justify-center font-mono text-gray-100 p-4">
      
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-8 pb-6 border-b border-gray-800 text-center">
          <p className="text-gray-400 text-xs tracking-[0.2em] uppercase mb-4 flex items-center justify-center gap-2">
            <Users size={14} /> Mission Room
          </p>
          
          <button 
            onClick={copyCode}
            className="group flex items-center justify-center gap-3 mx-auto hover:bg-gray-800 p-3 rounded-lg transition-colors cursor-pointer"
            title="Copy Code"
          >
            <span className="text-5xl font-bold tracking-widest text-sky-400 group-hover:text-sky-300 transition-colors drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              {roomCode}
            </span>
            {copied ? <Check className="text-green-400" size={24} /> : <Copy className="text-gray-500 group-hover:text-sky-400 transition-colors" size={24} />}
          </button>
        </div>

        {/* Players */}
        <div className="p-8 space-y-4">
          
          <div className="flex items-center gap-4 bg-gray-950 p-4 rounded border border-gray-800">
            <div className={`w-4 h-4 rounded-full ${colorMap[playerColor]}`}></div>
            <div className="flex-1">
              <p className="font-bold text-lg">{playerName}</p>
              <p className="text-xs text-gray-500 uppercase">You</p>
            </div>
            <div className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded uppercase">Ready</div>
          </div>

          <div className={`flex items-center gap-4 bg-gray-950 p-4 rounded border ${opponentName ? 'border-gray-800' : 'border-gray-800/50 border-dashed'}`}>
            {opponentName && opponentColor ? (
              <>
                <div className={`w-4 h-4 rounded-full ${colorMap[opponentColor]}`}></div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{opponentName}</p>
                  <p className="text-xs text-gray-500 uppercase">Opponent</p>
                </div>
                <div className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded uppercase">Ready</div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full py-2">
                <p className="text-gray-500 animate-pulse tracking-widest uppercase text-sm">Waiting for opponent...</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer / Countdown */}
        <div className="p-8 pt-0 flex flex-col items-center">
          
          <div className="h-24 flex items-center justify-center mb-4">
            {countdown !== null ? (
              <div className="text-center animate-bounce">
                <p className="text-sm text-sky-400 uppercase tracking-widest mb-1">Launching in</p>
                <p className="text-6xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                  {countdown}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-xs text-center uppercase tracking-widest">
                Waiting for 2 players to connect
              </p>
            )}
          </div>

          <button 
            onClick={handleLeave}
            className="text-xs text-gray-500 hover:text-red-400 tracking-widest uppercase transition-colors uppercase border-b border-transparent hover:border-red-400/30 pb-1"
          >
            Leave Room
          </button>
        </div>

      </div>
    </div>
  );
};
