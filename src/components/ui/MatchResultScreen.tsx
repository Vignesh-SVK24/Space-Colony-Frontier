import React from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect } from '../../multiplayer/socketClient';
import { Crosshair, ShieldAlert, Target, Clock, Trophy, Skull } from 'lucide-react';

export const MatchResultScreen: React.FC = () => {
  const { matchResult, playerId, reset } = useMultiplayerStore();

  if (!matchResult) return null;

  const isWinner = matchResult.winner === playerId;
  const mainColor = isWinner ? 'text-yellow-400' : 'text-red-500';
  const glowColor = isWinner ? 'drop-shadow-[0_0_25px_rgba(250,204,21,0.4)]' : 'drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]';

  const handleMainMenu = () => {
    disconnect();
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono bg-black/80 backdrop-blur-md p-4">
      
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Banner */}
        <div className={`p-10 text-center border-b border-gray-800 bg-gray-950 flex flex-col items-center gap-4`}>
          {isWinner ? <Trophy size={48} className="text-yellow-400" /> : <Skull size={48} className="text-red-500" />}
          <h1 className={`text-6xl md:text-7xl font-bold tracking-tighter ${mainColor} ${glowColor}`}>
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <p className="text-gray-400 uppercase tracking-[0.2em] mt-2">
            {isWinner ? `You destroyed ${matchResult.loserName}` : `${matchResult.winnerName} destroyed you`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-8 grid grid-cols-2 gap-4 bg-gray-900">
          
          <div className="bg-gray-950 p-6 rounded border border-gray-800 flex flex-col items-center text-center group hover:border-gray-700 transition-colors">
            <Target className="text-gray-500 mb-3 group-hover:text-sky-400 transition-colors" size={24} />
            <p className="text-3xl font-bold text-white mb-1">{matchResult.damageDealt}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Damage Dealt</p>
          </div>

          <div className="bg-gray-950 p-6 rounded border border-gray-800 flex flex-col items-center text-center group hover:border-gray-700 transition-colors">
            <Crosshair className="text-gray-500 mb-3 group-hover:text-sky-400 transition-colors" size={24} />
            <p className="text-3xl font-bold text-white mb-1">{matchResult.accuracy}%</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Accuracy</p>
          </div>

          <div className="bg-gray-950 p-6 rounded border border-gray-800 flex flex-col items-center text-center group hover:border-gray-700 transition-colors">
            <ShieldAlert className="text-gray-500 mb-3 group-hover:text-sky-400 transition-colors" size={24} />
            <p className="text-3xl font-bold text-white mb-1">{matchResult.shotsFired}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Shots Fired</p>
          </div>

          <div className="bg-gray-950 p-6 rounded border border-gray-800 flex flex-col items-center text-center group hover:border-gray-700 transition-colors">
            <Clock className="text-gray-500 mb-3 group-hover:text-sky-400 transition-colors" size={24} />
            <p className="text-3xl font-bold text-white mb-1">
              {Math.floor(matchResult.matchDuration / 60)}:{(matchResult.matchDuration % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Duration</p>
          </div>

        </div>

        {/* Actions */}
        <div className="p-8 border-t border-gray-800 bg-gray-950 flex justify-center">
          <button 
            onClick={handleMainMenu}
            className="px-10 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded uppercase tracking-[0.2em] transition-colors border border-gray-700"
          >
            Return to Menu
          </button>
        </div>

      </div>

    </div>
  );
};
