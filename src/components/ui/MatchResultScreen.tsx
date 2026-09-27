import React from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect, requestRematch } from '../../multiplayer/socketClient';
import { Crosshair, ShieldAlert, Target, Clock, Trophy, Skull, RotateCcw, Home } from 'lucide-react';

export const MatchResultScreen: React.FC = () => {
  const { matchResult, playerId, reset, isSolo, startSoloGame } = useMultiplayerStore();

  if (!matchResult) return null;

  const isWinner = matchResult.winner === playerId;
  const mainColor = isWinner ? 'text-amber-400' : 'text-red-500';
  const glowColor = isWinner ? 'drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]' : 'drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]';

  const handleMainMenu = () => {
    if (!isSolo) disconnect();
    reset();
  };

  const handlePlayAgain = () => {
    if (isSolo) {
      startSoloGame();
    } else {
      requestRematch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      
      <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        
        {/* Banner */}
        <div className="p-6 sm:p-8 text-center border-b border-gray-800 bg-gray-950 flex flex-col items-center gap-3">
          {isWinner ? (
            <Trophy size={42} className="text-amber-400 animate-bounce" />
          ) : (
            <Skull size={42} className="text-red-500 animate-pulse" />
          )}
          <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${mainColor} ${glowColor}`}>
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm uppercase tracking-wider font-semibold">
            {isWinner ? `Enemy Eliminated: ${matchResult.loserName}` : `Vessel Destroyed by: ${matchResult.winnerName}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-2 gap-2.5 sm:gap-4 bg-gray-900 overflow-y-auto">
          
          <div className="bg-gray-950/80 p-3.5 sm:p-5 rounded-lg border border-gray-800 flex flex-col items-center text-center">
            <Target className="text-gray-400 mb-1.5 sm:mb-2 text-sky-400" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-white">{matchResult.damageDealt}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">Damage Inflicted</p>
          </div>

          <div className="bg-gray-950/80 p-3.5 sm:p-5 rounded-lg border border-gray-800 flex flex-col items-center text-center">
            <Crosshair className="text-gray-400 mb-1.5 sm:mb-2 text-emerald-400" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-white">{matchResult.accuracy}%</p>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">Aim Accuracy</p>
          </div>

          <div className="bg-gray-950/80 p-3.5 sm:p-5 rounded-lg border border-gray-800 flex flex-col items-center text-center">
            <ShieldAlert className="text-gray-400 mb-1.5 sm:mb-2 text-amber-400" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-white">{matchResult.shotsFired}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">Blasters Fired</p>
          </div>

          <div className="bg-gray-950/80 p-3.5 sm:p-5 rounded-lg border border-gray-800 flex flex-col items-center text-center">
            <Clock className="text-gray-400 mb-1.5 sm:mb-2 text-purple-400" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-white">
              {Math.floor(matchResult.matchDuration / 60)}:{(matchResult.matchDuration % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">Combat Time</p>
          </div>

        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-800 bg-gray-950 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={handlePlayAgain}
            className="flex-1 py-3 px-6 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg uppercase tracking-wider text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30"
          >
            <RotateCcw size={16} />
            <span>{isSolo ? 'Play Solo Again' : 'Rematch / New Room'}</span>
          </button>

          <button 
            onClick={handleMainMenu}
            className="py-3 px-6 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-lg uppercase tracking-wider text-xs sm:text-sm transition-colors border border-gray-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={16} />
            <span>Main Menu</span>
          </button>
        </div>

      </div>

    </div>
  );
};
