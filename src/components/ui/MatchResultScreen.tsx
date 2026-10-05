import React from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { disconnect, requestRematch } from '../../multiplayer/colyseusClient';
import { Crosshair, ShieldAlert, Target, Clock, Trophy, Skull, RotateCcw, Home } from 'lucide-react';
import { nexusAudio } from '../../utils/nexusAudio';

export const MatchResultScreen: React.FC = () => {
  const { matchResult, playerId, reset, isSolo, startSoloGame } = useMultiplayerStore();

  if (!matchResult) return null;

  const isWinner = matchResult.winner === playerId;
  const mainColor = isWinner ? 'text-[#FFCC00]' : 'text-red-500';
  const glowColor = isWinner ? 'drop-shadow-[0_0_25px_rgba(255,204,0,0.6)]' : 'drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]';

  const handleMainMenu = () => {
    nexusAudio.playClick();
    if (!isSolo) disconnect();
    reset();
  };

  const handlePlayAgain = () => {
    nexusAudio.playConfirm();
    if (isSolo) {
      startSoloGame();
    } else {
      requestRematch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono bg-[#05070B]/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      
      <div className="w-full max-w-xl bg-[#061A35]/90 border border-[#8CCDEB]/40 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(5,7,11,0.9)] max-h-[92vh] flex flex-col">
        
        {/* Banner */}
        <div className="p-6 sm:p-8 text-center border-b border-[#8CCDEB]/20 bg-[#05070B]/60 flex flex-col items-center gap-3">
          {isWinner ? (
            <Trophy size={44} className="text-[#FFCC00] animate-bounce" />
          ) : (
            <Skull size={44} className="text-red-500 animate-pulse" />
          )}
          <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${mainColor} ${glowColor}`}>
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <p className="text-[#8CCDEB]/80 text-xs sm:text-sm uppercase tracking-wider font-semibold">
            {isWinner ? `Enemy Eliminated: ${matchResult.loserName}` : `Vessel Destroyed by: ${matchResult.winnerName}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-2 gap-2.5 sm:gap-4 bg-[#05070B]/40 overflow-y-auto">
          
          <div className="bg-[#08264A]/60 p-3.5 sm:p-5 rounded-xl border border-[#8CCDEB]/20 flex flex-col items-center text-center">
            <Target className="mb-1.5 sm:mb-2 text-[#8CCDEB]" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-[#F4F7FA]">{matchResult.damageDealt}</p>
            <p className="text-[10px] sm:text-xs text-[#8CCDEB]/70 uppercase tracking-widest">Damage Inflicted</p>
          </div>

          <div className="bg-[#08264A]/60 p-3.5 sm:p-5 rounded-xl border border-[#8CCDEB]/20 flex flex-col items-center text-center">
            <Crosshair className="mb-1.5 sm:mb-2 text-[#22c55e]" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-[#F4F7FA]">{matchResult.accuracy}%</p>
            <p className="text-[10px] sm:text-xs text-[#8CCDEB]/70 uppercase tracking-widest">Aim Accuracy</p>
          </div>

          <div className="bg-[#08264A]/60 p-3.5 sm:p-5 rounded-xl border border-[#8CCDEB]/20 flex flex-col items-center text-center">
            <ShieldAlert className="mb-1.5 sm:mb-2 text-[#FFCC00]" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-[#F4F7FA]">{matchResult.shotsFired}</p>
            <p className="text-[10px] sm:text-xs text-[#8CCDEB]/70 uppercase tracking-widest">Blasters Fired</p>
          </div>

          <div className="bg-[#08264A]/60 p-3.5 sm:p-5 rounded-xl border border-[#8CCDEB]/20 flex flex-col items-center text-center">
            <Clock className="mb-1.5 sm:mb-2 text-purple-400" size={20} />
            <p className="text-2xl sm:text-3xl font-black text-[#F4F7FA]">
              {Math.floor(matchResult.matchDuration / 60)}:{(matchResult.matchDuration % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-[10px] sm:text-xs text-[#8CCDEB]/70 uppercase tracking-widest">Combat Time</p>
          </div>

        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 border-t border-[#8CCDEB]/20 bg-[#05070B]/70 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={handlePlayAgain}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-[#0D3B73] via-[#0A2850] to-[#061A35] hover:from-[#1677FF] hover:to-[#0D3B73] text-[#F4F7FA] font-bold rounded-xl uppercase tracking-wider text-xs sm:text-sm transition-all border border-[#8CCDEB]/50 hover:border-[#FFCC00] flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(140,205,235,0.3)]"
          >
            <RotateCcw size={16} className="text-[#FFCC00]" />
            <span>{isSolo ? 'Play Solo Again' : 'Rematch / New Sector'}</span>
          </button>

          <button 
            onClick={handleMainMenu}
            className="py-3 px-6 bg-[#05070B]/80 hover:bg-[#061A35] text-[#8CCDEB] hover:text-[#F4F7FA] font-bold rounded-xl uppercase tracking-wider text-xs sm:text-sm transition-colors border border-[#8CCDEB]/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={16} />
            <span>Main Menu</span>
          </button>
        </div>

      </div>

    </div>
  );
};

