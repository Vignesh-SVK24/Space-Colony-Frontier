import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom, generateRoomCode } from '../../multiplayer/colyseusClient';
import { BattleColor } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { CombatDifficulty } from '../../config/combatConfig';
import { 
  AlertCircle, 
  Bot, 
  Users, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Maximize, 
  Minimize, 
  Shield, 
  Swords, 
  Info, 
  RotateCw 
} from 'lucide-react';
import { enterFullscreen, toggleFullscreen, useFullscreen } from '../../utils/fullscreenHelper';

const COLORS: Record<BattleColor, { hex: string; label: string; scheme: SpaceshipPaintSchemeKey }> = {
  yellow: { hex: '#eab308', label: 'Solar Vanguard', scheme: 'battle_yellow' },
  blue: { hex: '#3b82f6', label: 'Frost Interceptor', scheme: 'battle_blue' },
  red: { hex: '#ef4444', label: 'Crimson Raptor', scheme: 'battle_red' },
  green: { hex: '#22c55e', label: 'Emerald Phantom', scheme: 'battle_green' }
};

const RotatingShipPreview: React.FC<{ scheme: SpaceshipPaintSchemeKey }> = ({ scheme }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.55;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} rotation={[0.2, 0, 0]}>
      <SpaceshipModel paintScheme={scheme} throttle={0.35} />
    </group>
  );
};

export const LandingPage: React.FC = () => {
  const {
    gameModeSelection,
    setGameModeSelection,
    gameMode,
    setGameMode,
    aiDifficulty,
    setAIDifficulty,
    playerName,
    setPlayerName,
    playerColor,
    setPlayerColor,
    error,
    setError,
    serverUrl,
    isServerOnline,
    checkServerReachability,
    startSoloGame
  } = useMultiplayerStore();

  const [joinCode, setJoinCode] = React.useState('');
  const [createCode, setCreateCode] = React.useState(() => generateRoomCode());
  const [activeInfo, setActiveInfo] = React.useState<'SOLO' | 'ROOM' | null>(null);
  const { isFullscreen } = useFullscreen();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    checkServerReachability();
  }, [checkServerReachability, serverUrl]);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const effectiveName = playerName.trim() || 'Cadet-01';

  const handleCreate = () => {
    enterFullscreen();
    createRoom(effectiveName, playerColor, gameMode, createCode);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    enterFullscreen();
    joinRoom(joinCode.trim().toUpperCase(), effectiveName, playerColor);
  };

  const handleStartSolo = () => {
    enterFullscreen();
    startSoloGame();
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#030712] font-mono text-gray-100 select-none">
      
      {/* LAYER 1: Deep-Space Background Video */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030712]">
        <img
          src={`${import.meta.env.BASE_URL}space_landing_bg.jpg`}
          alt="Deep Space Vista"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
        />

        {!videoError && (
          <video
            ref={videoRef}
            src={`${import.meta.env.BASE_URL}assets/video/gemini_generated_video_2973b38a.mp4`}
            poster={`${import.meta.env.BASE_URL}space_landing_bg.jpg`}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={() => setVideoLoaded(true)}
            onPlaying={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/90 via-[#030712]/60 to-[#030712]/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/95 via-transparent to-[#030712]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(3,7,18,0.7)_100%)] pointer-events-none" />
      </div>

      {/* LAYER 2: Responsive Content Layout */}
      {/* Mobile Portrait: column layout with compact canvas at top and scrollable panel below */}
      {/* Mobile Landscape & Laptop/Desktop: row layout side-by-side */}
      <div className="relative z-10 flex flex-col md:flex-row landscape:flex-row h-full w-full overflow-hidden">
        
        {/* Left Operations Panel - Independently scrollable on all viewports with touch momentum scrolling */}
        <div 
          className="w-full md:w-[440px] lg:w-[480px] xl:w-[510px] landscape:w-[380px] sm:landscape:w-[420px] flex-1 md:flex-none landscape:flex-none min-h-0 h-full max-h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y scroll-touch flex flex-col justify-start p-3 sm:p-5 lg:p-6 border-b md:border-b-0 md:border-r landscape:border-r border-cyan-500/20 bg-black/65 backdrop-blur-md z-10"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          
          {/* Title Header */}
          <div className="mb-3 sm:mb-4 flex items-start justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <img
                src={`${import.meta.env.BASE_URL}app-icon.png`}
                alt="Game App Icon"
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.45)] border border-amber-400/40 shrink-0 object-cover"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/70 border border-sky-400/40 text-sky-300 text-[10px] sm:text-xs tracking-widest uppercase mb-1 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                  <Sparkles size={11} className="animate-spin text-sky-400" />
                  <span>Authoritative 3D Space Dogfight</span>
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-none drop-shadow-md">
                  SPACE BATTLE
                </h1>
                <p className="text-gray-300 text-[10px] sm:text-xs tracking-widest mt-0.5 uppercase font-medium">
                  Space Colony: Frontier · Realtime Combat
                </p>
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/60 hover:bg-sky-950/80 border border-gray-700/60 hover:border-sky-500/50 text-[10px] text-gray-300 hover:text-sky-300 transition-colors cursor-pointer backdrop-blur-md shadow-md"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">
                {isFullscreen ? 'Window' : 'Fullscreen'}
              </span>
            </button>
          </div>

          {/* Diagnostic Error Banner */}
          {error && (
            <div className="mb-3.5 bg-red-950/80 border border-red-500/60 p-3 rounded-xl text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)] shrink-0">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] sm:text-xs font-bold text-red-300 uppercase tracking-wider">
                      Multiplayer Server Notice
                    </h3>
                    <button
                      onClick={() => setError(null)}
                      className="text-gray-400 hover:text-white text-xs px-1 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-red-200/90 mt-1 leading-relaxed font-sans">
                    {error}
                  </p>

                  {/* Action Quick-Buttons */}
                  <div className="mt-2.5 pt-2 border-t border-red-500/30 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleStartSolo}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer active:scale-95"
                    >
                      <Bot size={12} />
                      <span>Play Solo (Offline)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreate}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: CLEAN INITIAL MODE SELECTION */}
          {gameModeSelection === 'SELECT' && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-semibold">
                Select Combat Mode
              </p>

              {/* SOLO MATCH CARD - Clean button without descriptive text, small "i" at top right */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setGameModeSelection('SOLO_CONFIG')}
                  className="w-full p-4 sm:p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-cyan-950/40 border border-emerald-500/40 hover:border-emerald-400/80 transition-all flex items-center gap-3.5 text-left shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-[0.99] cursor-pointer"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Bot size={24} className="text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white tracking-wider">SOLO MATCH</h2>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Instant Play
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                {/* Info "i" Symbol at Top Right Corner */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveInfo(activeInfo === 'SOLO' ? null : 'SOLO');
                  }}
                  onMouseEnter={() => setActiveInfo('SOLO')}
                  onMouseLeave={() => setActiveInfo(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all cursor-pointer z-20 shadow-md"
                  title="Mode Information"
                  aria-label="Mode Information"
                >
                  <Info size={13} />
                </button>

                {/* Info Popover / Tooltip */}
                {activeInfo === 'SOLO' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-11 z-30 w-64 p-3 bg-gray-950/95 border border-emerald-400/60 rounded-lg shadow-2xl text-[11px] text-gray-200 leading-relaxed backdrop-blur-md animate-fadeIn pointer-events-auto"
                  >
                    <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                      <Bot size={12} /> Solo AI Battle
                    </div>
                    Practice dogfighting against tactical AI with the full 250 HP system, rapid bullets, 3s laser beam, and 10s solar beam. No server connection required.
                  </div>
                )}
              </div>

              {/* ROOM MATCH CARD - Clean button without descriptive text, small "i" at top right */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setGameModeSelection('ROOM_CONFIG')}
                  className="w-full p-4 sm:p-5 rounded-xl bg-gradient-to-r from-sky-950/40 via-blue-950/30 to-indigo-950/40 border border-sky-500/40 hover:border-sky-400/80 transition-all flex items-center gap-3.5 text-left shadow-lg hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] active:scale-[0.99] cursor-pointer"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={24} className="text-sky-300" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white tracking-wider">ROOM MATCH</h2>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Online Match
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-sky-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                {/* Info "i" Symbol at Top Right Corner */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveInfo(activeInfo === 'ROOM' ? null : 'ROOM');
                  }}
                  onMouseEnter={() => setActiveInfo('ROOM')}
                  onMouseLeave={() => setActiveInfo(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-sky-950 border border-sky-500/40 text-sky-300 hover:text-white transition-all cursor-pointer z-20 shadow-md"
                  title="Mode Information"
                  aria-label="Mode Information"
                >
                  <Info size={13} />
                </button>

                {/* Info Popover / Tooltip */}
                {activeInfo === 'ROOM' && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-11 z-30 w-64 p-3 bg-gray-950/95 border border-sky-400/60 rounded-lg shadow-2xl text-[11px] text-gray-200 leading-relaxed backdrop-blur-md animate-fadeIn pointer-events-auto"
                  >
                    <div className="font-bold text-sky-400 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                      <Users size={12} /> Colyseus Realtime Room
                    </div>
                    Online 1v1 Duel, 4-Player Free-For-All, and 2v2 Team Battles with synchronized 250 HP and authoritative server physics.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: SOLO MATCH CONFIGURATION */}
          {gameModeSelection === 'SOLO_CONFIG' && (
            <div className="space-y-3.5 sm:space-y-4 animate-fadeIn pb-36 sm:pb-12">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <button
                  onClick={() => setGameModeSelection('SELECT')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Bot size={13} /> Solo AI Battle (250 HP)
                </span>
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign (e.g. Maverick)"
                  maxLength={15}
                  className="w-full bg-gray-900/90 border border-gray-700/80 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base focus:border-emerald-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
                  Computer Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'NORMAL', 'HARD'] as CombatDifficulty[]).map((diff) => {
                    const isSelected = aiDifficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setAIDifficulty(diff)}
                        className={`p-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                          isSelected 
                            ? diff === 'HARD'
                              ? 'border-red-500 bg-red-950/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                              : diff === 'NORMAL'
                              ? 'border-sky-500 bg-sky-950/60 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                              : 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <span>{diff}</span>
                        <span className="text-[8px] font-normal text-gray-400">
                          {diff === 'EASY' ? 'Relaxed' : diff === 'NORMAL' ? 'Tactical' : 'Relentless'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(COLORS) as BattleColor[]).map((color) => {
                    const isSelected = playerColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPlayerColor(color)}
                        className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected 
                            ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                            : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                        }`}
                      >
                        <div 
                          className={`w-5 h-5 rounded-full ${isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-950' : 'opacity-80'}`}
                          style={{ backgroundColor: COLORS[color].hex }}
                        />
                        <span className="text-[9px] uppercase text-gray-300 font-semibold">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartSolo}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-3 sm:py-3.5 px-4 rounded-lg uppercase tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Zap size={16} />
                <span>Start Solo Battle</span>
              </button>
            </div>
          )}

          {/* VIEW 3: ROOM MATCH CONFIGURATION (1v1, 4-Player FFA, 2v2) */}
          {gameModeSelection === 'ROOM_CONFIG' && (
            <div className="space-y-3 sm:space-y-3.5 animate-fadeIn pb-36 sm:pb-12">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <button
                  onClick={() => setGameModeSelection('SELECT')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
                  <Users size={13} /> Colyseus Room Match
                </span>
              </div>

              {/* Game Mode Selector */}
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
                  Multiplayer Battle Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGameMode('1v1')}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                      gameMode === '1v1'
                        ? 'border-sky-400 bg-sky-950/60 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Swords size={16} />
                    <span className="text-[11px] font-black">1v1 DUEL</span>
                    <span className="text-[8px] text-gray-400">2 Players</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('FFA')}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                      gameMode === 'FFA'
                        ? 'border-purple-400 bg-purple-950/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Users size={16} />
                    <span className="text-[11px] font-black">4-PLAYER FFA</span>
                    <span className="text-[8px] text-gray-400">All vs All</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('2v2')}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                      gameMode === '2v2'
                        ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Shield size={16} />
                    <span className="text-[11px] font-black">2v2 TEAM</span>
                    <span className="text-[8px] text-gray-400">Team A vs B</span>
                  </button>
                </div>
              </div>

              {/* Pilot Call Sign */}
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign"
                  maxLength={15}
                  className="w-full bg-gray-900/90 border border-gray-700/80 p-2 sm:p-2.5 rounded-lg text-sm sm:text-base focus:border-sky-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Ship Color Selector */}
              <div>
                <label className="block text-[10px] sm:text-[11px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(COLORS) as BattleColor[]).map((color) => {
                    const isSelected = playerColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPlayerColor(color)}
                        className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected 
                            ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_10px_rgba(56,189,248,0.3)]' 
                            : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                        }`}
                      >
                        <div 
                          className={`w-5 h-5 rounded-full ${isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-950' : 'opacity-80'}`}
                          style={{ backgroundColor: COLORS[color].hex }}
                        />
                        <span className="text-[9px] uppercase text-gray-300 font-semibold">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FIXED SINGLE ROOM CODE CREATION SECTION */}
              <div className="bg-gray-950/70 p-3 rounded-xl border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                    Host Match Code
                  </span>
                  <button
                    type="button"
                    onClick={() => setCreateCode(generateRoomCode())}
                    className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-sky-300 transition-colors cursor-pointer"
                    title="Generate another room code"
                  >
                    <RotateCw size={10} />
                    <span>New Code</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/70 border border-sky-500/40 rounded-lg py-2 px-3 text-center font-mono font-bold text-base sm:text-lg tracking-widest text-sky-200">
                    {createCode}
                  </div>
                  <button 
                    type="button"
                    onClick={handleCreate}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition-all shadow-[0_0_12px_rgba(2,132,199,0.3)] flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Users size={14} />
                    <span>Create Room</span>
                  </button>
                </div>
                <p className="text-[9px] text-gray-400">
                  One stable code for your match. Share this code with friends to join.
                </p>
              </div>

              {/* OR DIVIDER */}
              <div className="flex items-center gap-2.5 my-0.5 opacity-60">
                <div className="h-px bg-gray-700 flex-1"></div>
                <span className="text-[9px] uppercase tracking-widest text-gray-400">OR JOIN WITH CODE</span>
                <div className="h-px bg-gray-700 flex-1"></div>
              </div>

              {/* Join Room Input */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="flex-1 min-w-0 bg-gray-900 border border-gray-700 p-2 sm:p-2.5 rounded-lg text-center text-sm sm:text-base font-bold tracking-widest focus:border-sky-400 focus:outline-none transition-colors uppercase"
                />
                <button 
                  type="button"
                  onClick={handleJoin}
                  disabled={joinCode.trim().length < 4}
                  className="px-4 sm:px-5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-white font-bold rounded-lg uppercase tracking-widest text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Visual Panel - Compact on portrait mobile for SELECT, hidden during configuration to give 100% screen to controls */}
        <div className={`relative min-h-0 bg-transparent overflow-hidden flex items-center justify-center shrink-0 ${
          gameModeSelection !== 'SELECT' 
            ? 'hidden md:flex landscape:flex md:flex-1 landscape:flex-1 h-full' 
            : 'h-36 sm:h-52 md:h-full landscape:h-full md:flex-1 landscape:flex-1 flex-1'
        }`}>
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none z-0 transition-colors duration-500"
            style={{
              background: `radial-gradient(circle at center, ${COLORS[playerColor].hex}25 0%, rgba(3,7,18,0.2) 60%, transparent 100%)`
            }}
          />
          
          <div className="absolute top-3 right-3 z-20 text-right pointer-events-none hidden sm:block bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-500/25 shadow-lg">
            <p className="text-[9px] text-sky-400/90 uppercase tracking-widest font-semibold">Active Combat Chassis</p>
            <p className="text-xs font-bold text-white uppercase tracking-wider">{COLORS[playerColor].label}</p>
          </div>

          <Canvas 
            dpr={[1, 2]}
            camera={{ position: [0, 1.8, 5.5], fov: 45 }} 
            gl={{ alpha: true, antialias: true }}
            className="w-full h-full z-10 relative cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={0.7} />
            <spotLight position={[5, 6, 5]} intensity={2.5} angle={0.6} penumbra={1} color={COLORS[playerColor].hex} />
            <pointLight position={[-5, -4, -5]} intensity={1.2} color="#38bdf8" />
            <React.Suspense fallback={null}>
              <RotatingShipPreview scheme={COLORS[playerColor].scheme} />
            </React.Suspense>
          </Canvas>
        </div>

      </div>
    </div>
  );
};
