import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom, updateServerUrl } from '../../multiplayer/colyseusClient';
import { BattleColor } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { CombatDifficulty } from '../../config/combatConfig';
import { AlertCircle, Bot, Users, Sparkles, ArrowRight, ArrowLeft, Zap, Maximize, Minimize, Server, Edit2, Shield, Swords } from 'lucide-react';
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
  const [editingServer, setEditingServer] = React.useState(false);
  const [customServerUrl, setCustomServerUrl] = React.useState(serverUrl);
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
    createRoom(effectiveName, playerColor, gameMode);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    enterFullscreen();
    joinRoom(joinCode.toUpperCase(), effectiveName, playerColor);
  };

  const handleStartSolo = () => {
    enterFullscreen();
    startSoloGame();
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full overflow-hidden bg-[#030712] font-mono text-gray-100 overflow-y-auto overflow-x-hidden select-none">
      
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

        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/85 via-[#030712]/55 to-[#030712]/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/95 via-transparent to-[#030712]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(3,7,18,0.7)_100%)] pointer-events-none" />
      </div>

      {/* LAYER 3: Landing Page UI */}
      <div className="relative z-10 flex flex-col-reverse lg:flex-row min-h-screen w-full">
        {/* Left Operations Panel */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 flex flex-col justify-center max-w-xl mx-auto w-full overflow-y-auto border-t lg:border-t-0 lg:border-r border-cyan-500/20 bg-black/45 lg:bg-black/35 backdrop-blur-md z-10">
          
          {/* Title Header */}
          <div className="mb-6 sm:mb-8 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/70 border border-sky-400/40 text-sky-300 text-xs tracking-widest uppercase mb-3 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <Sparkles size={12} className="animate-spin text-sky-400" />
                <span>Authoritative 3D Space Dogfight</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                SPACE BATTLE
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm tracking-widest mt-1 uppercase font-medium">
                Space Colony: Frontier · Colyseus Realtime Combat
              </p>
            </div>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-sky-950/80 border border-gray-700/60 hover:border-sky-500/50 text-[11px] text-gray-300 hover:text-sky-300 transition-colors cursor-pointer backdrop-blur-md shadow-md"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">
                {isFullscreen ? 'Window' : 'Fullscreen'}
              </span>
            </button>
          </div>

          {/* Diagnostic Error Banner */}
          {error && (
            <div className="mb-6 bg-red-950/80 border border-red-500/60 p-4 rounded-xl text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-red-300 uppercase tracking-wider">
                      Multiplayer Server Connection Notice
                    </h3>
                    <button
                      onClick={() => setError(null)}
                      className="text-gray-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-red-200/90 mt-2 leading-relaxed font-sans">
                    {error}
                  </p>

                  {/* Action Quick-Buttons */}
                  <div className="mt-3.5 pt-3 border-t border-red-500/30 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleStartSolo}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <Bot size={14} />
                      <span>Play Solo Battle (Offline)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingServer(true);
                        setGameModeSelection('ROOM_CONFIG');
                      }}
                      className="px-3.5 py-2 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-300 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer font-bold active:scale-95"
                    >
                      <Server size={14} />
                      <span>Configure Server URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreate}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: CLEAN INITIAL MODE SELECTION */}
          {gameModeSelection === 'SELECT' && (
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">
                Select Combat Mode
              </p>

              {/* SOLO MATCH CARD */}
              <button
                onClick={() => setGameModeSelection('SOLO_CONFIG')}
                className="w-full group p-5 sm:p-6 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-cyan-950/40 border border-emerald-500/40 hover:border-emerald-400/80 transition-all flex items-center gap-4 text-left shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-[0.99] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bot size={28} className="text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-wider">SOLO MATCH</h2>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Instant Play
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Practice with the exact 250 HP system, rapid bullets, 3s laser beam, and 10s solar beam against tactical AI.
                  </p>
                </div>
                <ArrowRight size={20} className="text-emerald-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
              </button>

              {/* ROOM MATCH CARD */}
              <button
                onClick={() => setGameModeSelection('ROOM_CONFIG')}
                className="w-full group p-5 sm:p-6 rounded-xl bg-gradient-to-r from-sky-950/40 via-blue-950/30 to-indigo-950/40 border border-sky-500/40 hover:border-sky-400/80 transition-all flex items-center gap-4 text-left shadow-lg hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] active:scale-[0.99] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users size={28} className="text-sky-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-wider">ROOM MATCH</h2>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Authoritative Multiplayer
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    1v1 Room Battle, 4-Player Free-For-All, or 2v2 Team Battle with synchronized 250 HP and friendly-fire rules.
                  </p>
                </div>
                <ArrowRight size={20} className="text-sky-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
              </button>
            </div>
          )}

          {/* VIEW 2: SOLO MATCH CONFIGURATION */}
          {gameModeSelection === 'SOLO_CONFIG' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <button
                  onClick={() => setGameModeSelection('SELECT')}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Bot size={14} /> Solo AI Battle (250 HP)
                </span>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign (e.g. Maverick)"
                  maxLength={15}
                  className="w-full bg-gray-900/90 border border-gray-700/80 p-3 sm:p-3.5 rounded-lg text-base focus:border-emerald-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs text-gray-400 mb-2.5 uppercase tracking-widest font-semibold">
                  Computer Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['EASY', 'NORMAL', 'HARD'] as CombatDifficulty[]).map((diff) => {
                    const isSelected = aiDifficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setAIDifficulty(diff)}
                        className={`p-3 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected 
                            ? diff === 'HARD'
                              ? 'border-red-500 bg-red-950/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                              : diff === 'NORMAL'
                              ? 'border-sky-500 bg-sky-950/60 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                              : 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <span>{diff}</span>
                        <span className="text-[9px] font-normal text-gray-400">
                          {diff === 'EASY' ? 'Relaxed' : diff === 'NORMAL' ? 'Tactical' : 'Relentless'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {(Object.keys(COLORS) as BattleColor[]).map((color) => {
                    const isSelected = playerColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPlayerColor(color)}
                        className={`p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected 
                            ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                            : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                        }`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full ${isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-950' : 'opacity-80'}`}
                          style={{ backgroundColor: COLORS[color].hex }}
                        />
                        <span className="text-[10px] uppercase text-gray-300 font-semibold">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartSolo}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-4 px-6 rounded-lg uppercase tracking-widest text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Zap size={18} />
                <span>Start Solo Battle</span>
              </button>
            </div>
          )}

          {/* VIEW 3: ROOM MATCH CONFIGURATION (1v1, 4-Player FFA, 2v2) */}
          {gameModeSelection === 'ROOM_CONFIG' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <button
                  onClick={() => setGameModeSelection('SELECT')}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Users size={14} /> Colyseus Room Match
                </span>
              </div>

              {/* Game Mode Selector */}
              <div>
                <label className="block text-[11px] sm:text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                  Multiplayer Battle Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGameMode('1v1')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      gameMode === '1v1'
                        ? 'border-sky-400 bg-sky-950/60 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Swords size={18} />
                    <span className="text-xs font-black">1v1 DUEL</span>
                    <span className="text-[9px] text-gray-400">2 Players</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('FFA')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      gameMode === 'FFA'
                        ? 'border-purple-400 bg-purple-950/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Users size={18} />
                    <span className="text-xs font-black">4-PLAYER FFA</span>
                    <span className="text-[9px] text-gray-400">All vs All</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('2v2')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      gameMode === '2v2'
                        ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Shield size={18} />
                    <span className="text-xs font-black">2v2 TEAM</span>
                    <span className="text-[9px] text-gray-400">Team A vs B</span>
                  </button>
                </div>
              </div>

              {/* Pilot Call Sign */}
              <div>
                <label className="block text-[11px] sm:text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign"
                  maxLength={15}
                  className="w-full bg-gray-900/90 border border-gray-700/80 p-3 sm:p-3.5 rounded-lg text-base focus:border-sky-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Ship Color Selector */}
              <div>
                <label className="block text-[11px] sm:text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {(Object.keys(COLORS) as BattleColor[]).map((color) => {
                    const isSelected = playerColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPlayerColor(color)}
                        className={`p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected 
                            ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
                            : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                        }`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full ${isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-950' : 'opacity-80'}`}
                          style={{ backgroundColor: COLORS[color].hex }}
                        />
                        <span className="text-[10px] uppercase text-gray-300 font-semibold">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Create Room Button */}
              <button 
                type="button"
                onClick={handleCreate}
                className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-lg uppercase tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(2,132,199,0.25)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={16} />
                <span>Create {gameMode === '2v2' ? '2v2' : gameMode === 'FFA' ? '4-Player' : '1v1'} Room</span>
              </button>

              <div className="flex items-center gap-3 my-1 opacity-60">
                <div className="h-px bg-gray-700 flex-1"></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400">OR ENTER 6-CHAR CODE</span>
                <div className="h-px bg-gray-700 flex-1"></div>
              </div>

              {/* Join Room Input */}
              <div className="flex gap-2.5">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="flex-1 min-w-0 bg-gray-900 border border-gray-700 p-3 rounded-lg text-center text-base sm:text-lg font-bold tracking-widest focus:border-sky-400 focus:outline-none transition-colors uppercase"
                />
                <button 
                  type="button"
                  onClick={handleJoin}
                  disabled={joinCode.length < 4}
                  className="px-6 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-white font-bold rounded-lg uppercase tracking-widest text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
              </div>

              {/* Server Connection Bar */}
              <div className="pt-2 border-t border-gray-800/80">
                <div className="flex items-center justify-between text-[10px] text-gray-400 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 truncate">
                    <Server size={13} className="text-sky-400 shrink-0" />
                    <span className="truncate">Server: <span className="text-gray-300 font-mono">{serverUrl}</span></span>
                    {isServerOnline === true && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ONLINE
                      </span>
                    )}
                    {isServerOnline === false && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.5 rounded shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        OFFLINE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => checkServerReachability()}
                      className="text-gray-400 hover:text-white uppercase tracking-wider text-[9px] cursor-pointer"
                      title="Test Connection"
                    >
                      Check
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingServer(!editingServer)}
                      className="text-sky-400 hover:text-sky-300 uppercase tracking-wider font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 size={10} />
                      <span>{editingServer ? 'Close' : 'Configure'}</span>
                    </button>
                  </div>
                </div>

                {editingServer && (
                  <div className="mt-2.5 p-3 bg-gray-950/90 border border-gray-700/80 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">
                        Colyseus Server URL
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Local: http://localhost:3001
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customServerUrl}
                        onChange={(e) => setCustomServerUrl(e.target.value)}
                        placeholder="http://localhost:3001"
                        className="flex-1 bg-gray-900 border border-gray-700 text-xs px-3 py-2 rounded text-white font-mono focus:border-sky-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customServerUrl.trim()) {
                            updateServerUrl(customServerUrl.trim());
                            setEditingServer(false);
                          }
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      💡 Tip: For local play, run <code className="text-sky-300 bg-black/40 px-1 py-0.5 rounded">npm run server</code>. For online multiplayer with friends, host the server (e.g. Render, Railway, Fly.io) and paste the server URL above.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Right Visual Panel */}
        <div className="flex-1 relative h-64 sm:h-80 lg:h-auto min-h-[260px] bg-transparent overflow-hidden flex items-center justify-center">
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none z-0 transition-colors duration-500"
            style={{
              background: `radial-gradient(circle at center, ${COLORS[playerColor].hex}25 0%, rgba(3,7,18,0.2) 60%, transparent 100%)`
            }}
          />
          
          <div className="absolute top-4 right-4 z-20 text-right pointer-events-none hidden sm:block bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-cyan-500/25 shadow-lg">
            <p className="text-[10px] text-sky-400/90 uppercase tracking-widest font-semibold">Active Combat Chassis</p>
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
