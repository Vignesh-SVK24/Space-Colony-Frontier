import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom } from '../../multiplayer/socketClient';
import { BattleColor } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { CombatDifficulty } from '../../config/combatConfig';
import { AlertCircle, Bot, Users, Sparkles, ArrowRight, ArrowLeft, Zap, Maximize, Minimize } from 'lucide-react';
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
    aiDifficulty,
    setAIDifficulty,
    playerName,
    setPlayerName,
    playerColor,
    setPlayerColor,
    error,
    startSoloGame
  } = useMultiplayerStore();

  const [joinCode, setJoinCode] = React.useState('');
  const { isFullscreen } = useFullscreen();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    // Attempt programmatic playback to satisfy strict browser autoplay policies
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Browser prevented autoplay; fallback poster/image stays visible
      });
    }
  }, []);

  const effectiveName = playerName.trim() || 'Cadet-01';

  const handleCreate = () => {
    enterFullscreen();
    createRoom(effectiveName, playerColor);
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
    <div className="relative min-h-[100dvh] w-full bg-[#030712] font-mono text-gray-100 overflow-y-auto overflow-x-hidden select-none">
      
      {/* ========================================================================= */}
      {/* LAYER 1: Full Cinematic Deep-Space Background Video                      */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030712]">
        {/* Fallback image: visible before video loads or if video fails */}
        <img
          src={`${import.meta.env.BASE_URL}space_landing_bg.jpg`}
          alt="Deep Space Vista"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
        />

        {/* Cinematic Video Element */}
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

        {/* ======================================================================= */}
        {/* LAYER 2: Dark Cinematic Gradient & Vignette Overlay                      */}
        {/* ======================================================================= */}
        {/* Directional gradient: darker behind left-side text/buttons, translucent across right side */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/85 via-[#030712]/55 to-[#030712]/25 pointer-events-none" />
        
        {/* Vertical gradient: softens header and bottom edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/95 via-transparent to-[#030712]/60 pointer-events-none" />
        
        {/* Radial vignette: deepens corners while maintaining center animated space vista */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(3,7,18,0.7)_100%)] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: Landing Page UI & Interactive Panels                             */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col-reverse lg:flex-row min-h-[100dvh] w-full">
        {/* Left Operations Panel: Mode Selection & Setup */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 flex flex-col justify-center max-w-xl mx-auto w-full border-t lg:border-t-0 lg:border-r border-cyan-500/20 bg-black/45 lg:bg-black/35 backdrop-blur-md z-10">
          
          {/* Title Header with Fullscreen Toggle */}
          <div className="mb-6 sm:mb-8 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/70 border border-sky-400/40 text-sky-300 text-xs tracking-widest uppercase mb-3 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <Sparkles size={12} className="animate-spin text-sky-400" />
                <span>Futuristic Space Dogfight</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                SPACE BATTLE
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm tracking-widest mt-1 uppercase font-medium">
                Space Colony: Frontier · Combat Simulation
              </p>
            </div>

          {/* Fullscreen Button (Hide address bar) */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-sky-950/80 border border-gray-700/60 hover:border-sky-500/50 text-[11px] text-gray-300 hover:text-sky-300 transition-colors cursor-pointer backdrop-blur-sm shadow-md"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Hide address bar)'}
          >
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
            <span className="hidden sm:inline uppercase tracking-wider font-semibold">
              {isFullscreen ? 'Window' : 'Fullscreen'}
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-950/60 border border-red-500/50 p-3.5 rounded-lg text-red-300 flex items-center gap-3 text-xs sm:text-sm animate-pulse">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: CLEAN INITIAL MODE SELECTION (SOLO MATCH vs ROOM MATCH)           */}
        {/* ========================================================================= */}
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
                  Engage an advanced AI opponent with tactical maneuvering, obstacle cover, and 5s laser beam attacks.
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
                    Real Players
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Connect 2 real players in a synchronized dogfight arena using 6-character room codes.
                </p>
              </div>
              <ArrowRight size={20} className="text-sky-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SOLO MATCH CONFIGURATION (DIFFICULTY + COLOR + START)              */}
        {/* ========================================================================= */}
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
                <Bot size={14} /> Solo AI Battle
              </span>
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
                placeholder="Enter Call Sign (e.g. Maverick)"
                maxLength={15}
                className="w-full bg-gray-900/90 border border-gray-700/80 p-3 sm:p-3.5 rounded-lg text-base focus:border-emerald-400 focus:outline-none transition-colors"
              />
            </div>

            {/* AI Difficulty Selector: EASY, NORMAL, HARD */}
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

            {/* Launch Solo Match Button */}
            <button
              onClick={handleStartSolo}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-4 px-6 rounded-lg uppercase tracking-widest text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Zap size={18} />
              <span>Start Solo Battle</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ROOM MATCH CONFIGURATION (CREATE / JOIN WITH 6-CHAR CODE)          */}
        {/* ========================================================================= */}
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
                <Users size={14} /> Room Matchmaking
              </span>
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
              onClick={handleCreate}
              className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-lg uppercase tracking-widest text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(2,132,199,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users size={16} />
              <span>Create New Room</span>
            </button>

            {/* Divider */}
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
                onClick={handleJoin}
                disabled={joinCode.length < 4}
                className="px-6 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-white font-bold rounded-lg uppercase tracking-widest text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Right Visual Panel: 3D Spaceship Canvas */}
      <div className="flex-1 relative h-64 sm:h-80 lg:h-auto min-h-[260px] bg-transparent overflow-hidden flex items-center justify-center">
        {/* Subtle accent glow matching chosen ship color */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none z-0 transition-colors duration-500"
          style={{
            background: `radial-gradient(circle at center, ${COLORS[playerColor].hex}25 0%, rgba(3,7,18,0.2) 60%, transparent 100%)`
          }}
        />
        
        {/* Vessel Tag */}
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
