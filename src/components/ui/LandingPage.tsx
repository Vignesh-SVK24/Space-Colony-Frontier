import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom, generateRoomCode } from '../../multiplayer/colyseusClient';
import { BattleColor } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { CombatDifficulty } from '../../config/combatConfig';
import { nexusAudio } from '../../utils/nexusAudio';
import { 
  Users, 
  Bot, 
  ArrowRight, 
  Zap, 
  Maximize, 
  Minimize, 
  Shield, 
  Swords, 
  RotateCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Crosshair,
  Radio,
  X,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import { enterFullscreen, toggleFullscreen, useFullscreen } from '../../utils/fullscreenHelper';

const CHASSIS_CONFIG: Record<BattleColor, { hex: string; label: string; scheme: SpaceshipPaintSchemeKey }> = {
  yellow: { hex: '#FFCC00', label: 'Solar Vanguard', scheme: 'battle_yellow' },
  blue: { hex: '#8CCDEB', label: 'Frost Interceptor', scheme: 'battle_blue' },
  red: { hex: '#ef4444', label: 'Crimson Raptor', scheme: 'battle_red' },
  green: { hex: '#107E57', label: 'Emerald Phantom', scheme: 'battle_green' }
};

const RotatingHeroShip: React.FC<{ scheme: SpaceshipPaintSchemeKey }> = ({ scheme }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
      groupRef.current.position.y = Math.sin(Date.now() * 0.0015) * 0.12 - 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} rotation={[0.2, 0, 0]}>
      <SpaceshipModel paintScheme={scheme} throttle={0.35} />
    </group>
  );
};

export const LandingPage: React.FC = () => {
  const {
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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [soloModalOpen, setSoloModalOpen] = useState(false);
  const [intelDrawerOpen, setIntelDrawerOpen] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [createCode, setCreateCode] = useState(() => generateRoomCode());
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(() => nexusAudio.getMuted());
  
  const { isFullscreen } = useFullscreen();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    checkServerReachability();
  }, [checkServerReachability, serverUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const effectiveName = playerName.trim() || 'Cadet-01';

  const handleCreate = () => {
    nexusAudio.playConfirm();
    enterFullscreen();
    createRoom(effectiveName, playerColor, gameMode, createCode);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    nexusAudio.playConfirm();
    enterFullscreen();
    joinRoom(joinCode.trim().toUpperCase(), effectiveName, playerColor);
  };

  const handleStartSolo = () => {
    nexusAudio.playConfirm();
    enterFullscreen();
    startSoloGame();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createCode);
    setCopiedCode(true);
    nexusAudio.playClick(1400);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleAudio = () => {
    const muted = nexusAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#05070B] font-mono text-[#F4F7FA] select-none">
      
      {/* =========================================================================
          1. BACKGROUND CINEMATIC SPACE VIDEO (85-90% HIGHLY VISIBLE, NO WHITE OVERLAYS)
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#05070B]">
        <img
          src={`${import.meta.env.BASE_URL}space_landing_bg.jpg`}
          alt="Space Vista"
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

        {/* Controlled Midnight Black & Deep Navy Vignette (Subtle, ensures text readability on Left) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070B]/90 via-[#061A35]/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B]/80 via-transparent to-[#05070B]/40 pointer-events-none" />
      </div>

      {/* =========================================================================
          2. FOREGROUND GAME LAUNCHER INTERFACE (LEFT 40% / RIGHT 60%)
          ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-5 lg:p-6 pointer-events-none">
        
        {/* TOP HUD BAR */}
        <header className="flex items-center justify-between w-full pointer-events-auto">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img 
              src={`${import.meta.env.BASE_URL}app-icon.png`} 
              alt="Space Colony Frontier Emblem" 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg border border-[#8CCDEB]/40 shadow-[0_0_15px_rgba(140,205,235,0.25)] object-cover" 
            />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm sm:text-lg font-black tracking-wider text-[#F4F7FA]">SPACE COLONY</span>
                <span className="text-sm sm:text-lg font-black tracking-wider text-[#FFCC00]">FRONTIER</span>
              </div>
              <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#8CCDEB]/80 mt-0.5">
                BATTLE • EXPLORE • SURVIVE
              </p>
            </div>
          </div>

          {/* Right Top Status Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#061A35]/80 border border-[#8CCDEB]/30 backdrop-blur-md text-[9px] sm:text-[10px] text-[#F4F7FA]"
              title={serverUrl}
            >
              <span className={`w-2 h-2 rounded-full ${isServerOnline === false ? 'bg-red-500 animate-pulse' : 'bg-[#107E57] animate-pulse'}`} />
              <span className="hidden sm:inline font-bold">
                {isServerOnline === false ? 'OFFLINE' : 'SERVER ONLINE'}
              </span>
            </div>

            <button 
              onClick={toggleAudio} 
              className="p-2 sm:p-2.5 rounded-lg bg-[#061A35]/80 hover:bg-[#0B315A] border border-[#8CCDEB]/30 text-[#8CCDEB] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button 
              onClick={toggleFullscreen} 
              className="p-2 sm:p-2.5 rounded-lg bg-[#061A35]/80 hover:bg-[#0B315A] border border-[#8CCDEB]/30 text-[#8CCDEB] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          </div>
        </header>

        {/* MAIN BATTLE ARENA DISPLAY:
            - Desktop & Landscape: Left 40% Controls / Right 60% 3D Spaceship
            - Portrait Mobile: Top Spaceship / Bottom Compact Controls */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 items-center my-auto min-h-0 pointer-events-none">
          
          {/* ========================================================
              LEFT COLUMN: PLAYER PROFILE & GAME ACTIONS (40%)
              ======================================================== */}
          <div className="md:col-span-5 landscape:col-span-5 flex flex-col justify-center gap-3 sm:gap-3.5 z-20 pointer-events-auto max-w-md w-full order-2 md:order-1 landscape:order-1">
            
            {/* 1. Player Profile HUD Card */}
            <div className="bg-[#061A35]/85 border border-[#8CCDEB]/35 rounded-xl p-3 sm:p-3.5 backdrop-blur-md shadow-[0_4px_25px_rgba(5,7,11,0.7)]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#0B315A]">
                <span className="text-[10px] font-bold text-[#8CCDEB] uppercase tracking-wider flex items-center gap-1.5">
                  <Radio size={12} className="text-[#8CCDEB] animate-pulse" />
                  PILOT PROFILE
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#107E57]/20 border border-[#107E57]/40 text-emerald-300 font-bold uppercase tracking-wider">
                  ACTIVE
                </span>
              </div>

              {/* Callsign Input */}
              <div className="flex items-center gap-2 mb-2.5">
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Callsign"
                  maxLength={15}
                  className="flex-1 bg-[#05070B]/90 border border-[#8CCDEB]/40 focus:border-[#8CCDEB] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-[#F4F7FA] outline-none transition-colors"
                />
              </div>

              {/* Hull Scheme Selector */}
              <div>
                <div className="flex items-center justify-between text-[9px] text-[#8CCDEB]/80 uppercase tracking-widest mb-1.5 font-bold">
                  <span>CHASSIS PAINT</span>
                  <span className="text-[#FFCC00]">{CHASSIS_CONFIG[playerColor].label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CHASSIS_CONFIG) as BattleColor[]).map((c) => {
                    const isSelected = playerColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          nexusAudio.playClick(1200);
                          setPlayerColor(c);
                        }}
                        className={`py-1 px-1.5 rounded-md border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#FFCC00] bg-[#FFB000]/15 text-[#FFCC00] shadow-[0_0_8px_rgba(255,204,0,0.3)]'
                            : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400 hover:border-[#8CCDEB]/40'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHASSIS_CONFIG[c].hex }} />
                        <span className="text-[9px] uppercase font-bold">{c.slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Combat Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setGameMode('1v1');
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  gameMode === '1v1'
                    ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] shadow-[0_0_12px_rgba(140,205,235,0.3)] font-bold'
                    : 'border-[#0B315A] bg-[#061A35]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Swords size={12} className={gameMode === '1v1' ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                  <span className="text-[10px] font-black">1V1</span>
                </div>
                <span className="text-[8px] opacity-75">Duel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1100);
                  setGameMode('FFA');
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  gameMode === 'FFA'
                    ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] shadow-[0_0_12px_rgba(140,205,235,0.3)] font-bold'
                    : 'border-[#0B315A] bg-[#061A35]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Crosshair size={12} className={gameMode === 'FFA' ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                  <span className="text-[10px] font-black">FFA</span>
                </div>
                <span className="text-[8px] opacity-75">4 Pilots</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1200);
                  setGameMode('2v2');
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  gameMode === '2v2'
                    ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] shadow-[0_0_12px_rgba(140,205,235,0.3)] font-bold'
                    : 'border-[#0B315A] bg-[#061A35]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Shield size={12} className={gameMode === '2v2' ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                  <span className="text-[10px] font-black">2V2</span>
                </div>
                <span className="text-[8px] opacity-75">Squad</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-2.5 bg-[#05070B]/90 border border-red-500/60 rounded-lg text-red-300 text-[11px] flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 font-bold ml-2 hover:bg-white/10 px-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 3. Primary Game Action Buttons */}
            <div className="flex flex-col gap-2">
              
              {/* [ CREATE ROOM ] */}
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1200);
                  setCreateModalOpen(true);
                }}
                className="w-full py-3 sm:py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#0B315A] via-[#08264A] to-[#0B315A] hover:from-[#0E3E73] hover:to-[#0E3E73] active:scale-[0.99] border-2 border-[#8CCDEB] text-[#F4F7FA] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(140,205,235,0.25)] flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <Users size={16} className="text-[#FFCC00] group-hover:scale-110 transition-transform" />
                <span>CREATE ROOM</span>
              </button>

              {/* [ JOIN ROOM ] */}
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setJoinModalOpen(true);
                }}
                className="w-full py-2.5 sm:py-3 px-5 rounded-xl bg-[#05070B]/85 hover:bg-[#061A35] active:scale-[0.99] border border-[#8CCDEB]/60 hover:border-[#8CCDEB] text-[#8CCDEB] hover:text-[#F4F7FA] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <ArrowRight size={16} />
                <span>JOIN ROOM</span>
              </button>

              {/* [ SOLO VS AI ] */}
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(900);
                  setSoloModalOpen(true);
                }}
                className="w-full py-2 px-4 rounded-lg bg-[#061A35]/50 hover:bg-[#08264A] active:scale-[0.99] border border-[#0B315A] text-[#8CCDEB]/80 hover:text-[#8CCDEB] font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot size={13} className="text-[#107E57]" />
                <span>SOLO TRAINING (AI DRONE)</span>
              </button>
            </div>

          </div>

          {/* ========================================================
              RIGHT COLUMN: 3D SPACESHIP & SPACE ENVIRONMENT (60%)
              ======================================================== */}
          <div className="md:col-span-7 landscape:col-span-7 h-[220px] sm:h-[300px] md:h-full landscape:h-full flex items-center justify-center relative order-1 md:order-2 landscape:order-2 pointer-events-auto">
            
            {/* Subtle Aerospace Holographic Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-40">
              <div className="w-[260px] h-[260px] sm:w-[380px] sm:h-[380px] rounded-full border border-[#8CCDEB]/20 animate-[spin_80s_linear_infinite]" />
              <div className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-full border border-dashed border-[#8CCDEB]/25 animate-[spin_50s_linear_infinite_reverse]" />
            </div>

            {/* Three.js Interactive 3D Canvas */}
            <div className="w-full h-full max-h-[58vh] aspect-square flex items-center justify-center relative">
              <Canvas 
                dpr={[1, 2]}
                camera={{ position: [0, 1.4, 4.8], fov: 45 }} 
                gl={{ alpha: true, antialias: true }}
                className="w-full h-full z-10 relative cursor-grab active:cursor-grabbing"
              >
                <ambientLight intensity={0.9} />
                <directionalLight position={[6, 8, 5]} intensity={2.0} color="#F4F7FA" />
                <spotLight position={[-5, 6, -3]} intensity={1.6} angle={0.6} penumbra={1} color={CHASSIS_CONFIG[playerColor].hex} />
                <pointLight position={[0, -2, 4]} intensity={0.9} color="#8CCDEB" />
                <React.Suspense fallback={null}>
                  <RotatingHeroShip scheme={CHASSIS_CONFIG[playerColor].scheme} />
                </React.Suspense>
              </Canvas>
            </div>

            {/* Subtle Telemetry Overlay */}
            <div className="absolute bottom-2 right-2 text-right pointer-events-none font-mono text-[9px] text-[#8CCDEB]/60 hidden sm:block">
              <p>SECTOR // FRONTIER-04</p>
              <p className="text-[#FFCC00]/70">ARENA 300M ENGAGED</p>
            </div>

          </div>

        </div>

        {/* BOTTOM HUD / INTEL DRAWER TRIGGER */}
        <footer className="w-full flex items-center justify-between pointer-events-auto border-t border-[#0B315A]/60 pt-2 text-[10px] text-[#8CCDEB]/70">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#107E57]" />
            <span className="hidden sm:inline font-mono">WASD / JOYSTICK TO FLY • MOUSE / TOUCH TO FIRE</span>
            <span className="sm:hidden font-mono">TOUCH JOYSTICK TO FLY</span>
          </div>

          {/* Toggle Tactical Intel Slide-up */}
          <button 
            onClick={() => setIntelDrawerOpen(!intelDrawerOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#061A35]/80 hover:bg-[#0B315A] border border-[#8CCDEB]/30 text-[#F4F7FA] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Info size={12} className="text-[#FFCC00]" />
            <span>TACTICAL INTEL</span>
            {intelDrawerOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>

          <div className="hidden sm:block text-[#8CCDEB]/60">
            SYS // 60HZ TICK • V2.4.0
          </div>
        </footer>

      </div>

      {/* =========================================================================
          3. SECONDARY TACTICAL INTEL DRAWER (LIMITED / PARTIAL GAME-STYLE SCROLL)
          ========================================================================= */}
      {intelDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-[#05070B]/80 backdrop-blur-md flex items-end justify-center animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-4xl bg-[#061A35]/95 border-t-2 border-[#8CCDEB] rounded-t-2xl p-5 sm:p-7 max-h-[75vh] overflow-y-auto overscroll-contain shadow-2xl flex flex-col gap-5 text-[#F4F7FA]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#0B315A]">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wider text-[#F4F7FA]">
                  TACTICAL INTEL & DOCTRINES
                </h3>
                <p className="text-[10px] text-[#8CCDEB] uppercase tracking-widest">
                  Spacecraft combat specifications & operational protocols
                </p>
              </div>
              <button 
                onClick={() => setIntelDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0B315A] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Intel Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-3.5 rounded-xl bg-[#05070B]/70 border border-[#0B315A]">
                <div className="text-[#FFCC00] font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Zap size={14} /> RAPID PLASMA BOLTS
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  260 m/s high-velocity authoritative bullets. 30 round capacity with 2.0s automatic reload cycle.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05070B]/70 border border-[#0B315A]">
                <div className="text-[#8CCDEB] font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Crosshair size={14} /> DIRECTED LASER BEAM
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  12 HP instantaneous directed beam with 3.0s recharge interval. Lock on with generous target cone.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05070B]/70 border border-[#0B315A]">
                <div className="text-amber-400 font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Radio size={14} /> HIGH-YIELD SOLAR BURST
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  30 HP heavy piercing blast with 10.0s cooldown. Devastating punch through asteroid cover.
                </p>
              </div>

            </div>

            <div className="p-3 rounded-xl bg-[#08264A]/60 border border-[#8CCDEB]/20 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Authoritative Colyseus Server • 60Hz State Synchronization</span>
              <button
                onClick={() => setIntelDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#0B315A] hover:bg-[#0E3E73] text-[#F4F7FA] font-bold uppercase rounded-lg text-[10px] cursor-pointer"
              >
                Close Intel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. CREATE ROOM GAME MODAL (MIDNIGHT BLACK + DEEP NAVY + CYAN + GOLD)
          ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070B]/80 backdrop-blur-md animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-lg bg-[#061A35]/95 border-2 border-[#8CCDEB]/60 rounded-2xl shadow-[0_0_40px_rgba(5,7,11,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-[#0B315A] flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#FFCC00]" />
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wider text-[#F4F7FA]">
                    CREATE FRONTIER ROOM
                  </h3>
                  <p className="text-[10px] text-[#8CCDEB]">
                    Authoritative multiplayer combat room
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              
              {/* Prominent Generated Room Code */}
              <div className="p-3.5 rounded-xl bg-[#05070B]/80 border border-[#8CCDEB]/40 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8CCDEB]">
                  <span>ROOM CODE</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateCode(generateRoomCode());
                      nexusAudio.playClick(1100);
                    }}
                    className="flex items-center gap-1 text-[#FFCC00] hover:underline cursor-pointer"
                  >
                    <RotateCw size={11} />
                    <span>Regenerate</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#061A35] border border-[#8CCDEB]/50 rounded-lg py-2 px-3 text-center font-black text-2xl tracking-[0.25em] text-[#FFCC00]">
                    {createCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-2.5 rounded-lg bg-[#0B315A] hover:bg-[#0E3E73] border border-[#8CCDEB]/60 text-[#8CCDEB] hover:text-[#F4F7FA] font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {copiedCode ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  COMBAT DOCTRINE
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGameMode('1v1')}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      gameMode === '1v1'
                        ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] font-bold'
                        : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-black">1V1</p>
                    <p className="text-[8px] opacity-75">Duel (2P)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('FFA')}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      gameMode === 'FFA'
                        ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] font-bold'
                        : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-black">FFA</p>
                    <p className="text-[8px] opacity-75">4 Pilots</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('2v2')}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      gameMode === '2v2'
                        ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] font-bold'
                        : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-black">2V2</p>
                    <p className="text-[8px] opacity-75">Squads</p>
                  </button>
                </div>
              </div>

              {/* Pilot Callsign */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  CALLSIGN
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Callsign"
                  maxLength={15}
                  className="w-full bg-[#05070B]/90 border border-[#8CCDEB]/40 focus:border-[#8CCDEB] p-2.5 rounded-lg text-xs font-bold text-[#F4F7FA] outline-none"
                />
              </div>

              {/* Hull Chassis Paint Scheme */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  CHASSIS SCHEME
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CHASSIS_CONFIG) as BattleColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlayerColor(c)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer ${
                        playerColor === c
                          ? 'border-[#FFCC00] bg-[#FFB000]/15'
                          : 'border-[#0B315A] bg-[#05070B]/60'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: CHASSIS_CONFIG[c].hex }} />
                      <span className="text-[9px] uppercase font-bold text-[#F4F7FA]">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 pt-2 border-t border-[#0B315A] flex items-center justify-end gap-2.5 bg-[#08264A]/80">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-slate-300 hover:text-white cursor-pointer"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B315A] to-[#08264A] hover:from-[#0E3E73] hover:to-[#0E3E73] border-2 border-[#8CCDEB] text-[#F4F7FA] font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(140,205,235,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <Users size={15} className="text-[#FFCC00]" />
                <span>ENTER BATTLE</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          5. JOIN ROOM GAME MODAL (MIDNIGHT BLACK + DEEP NAVY + CYAN)
          ========================================================================= */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070B]/80 backdrop-blur-md animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-lg bg-[#061A35]/95 border-2 border-[#8CCDEB]/60 rounded-2xl shadow-[0_0_40px_rgba(5,7,11,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-[#0B315A] flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <ArrowRight size={18} className="text-[#8CCDEB]" />
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wider text-[#F4F7FA]">
                    JOIN FRONTIER
                  </h3>
                  <p className="text-[10px] text-[#8CCDEB]">
                    Connect to existing squad match
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setJoinModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              
              {/* Room Code Input */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  ENTER ROOM CODE
                </label>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="w-full bg-[#05070B] border-2 border-[#8CCDEB] focus:border-[#FFCC00] p-3 rounded-xl text-center text-xl sm:text-2xl font-black tracking-[0.3em] text-[#FFCC00] outline-none shadow-[0_0_15px_rgba(140,205,235,0.25)] transition-all uppercase placeholder:text-slate-600"
                />
              </div>

              {/* Callsign */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  CALLSIGN
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Callsign"
                  maxLength={15}
                  className="w-full bg-[#05070B]/90 border border-[#8CCDEB]/40 focus:border-[#8CCDEB] p-2.5 rounded-lg text-xs font-bold text-[#F4F7FA] outline-none"
                />
              </div>

              {/* Hull Scheme */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  CHASSIS SCHEME
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CHASSIS_CONFIG) as BattleColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlayerColor(c)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer ${
                        playerColor === c
                          ? 'border-[#FFCC00] bg-[#FFB000]/15'
                          : 'border-[#0B315A] bg-[#05070B]/60'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: CHASSIS_CONFIG[c].hex }} />
                      <span className="text-[9px] uppercase font-bold text-[#F4F7FA]">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {joinCode.trim().length > 0 && joinCode.trim().length < 4 && (
                <p className="text-[10px] text-amber-400">
                  Room code must be 4 to 6 characters.
                </p>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 pt-2 border-t border-[#0B315A] flex items-center justify-end gap-2.5 bg-[#08264A]/80">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-slate-300 hover:text-white cursor-pointer"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B315A] to-[#08264A] hover:from-[#0E3E73] hover:to-[#0E3E73] disabled:opacity-40 border-2 border-[#8CCDEB] text-[#F4F7FA] font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(140,205,235,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight size={15} />
                <span>JOIN BATTLE</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          6. SOLO AI TRAINING MODAL
          ========================================================================= */}
      {soloModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070B]/80 backdrop-blur-md animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-lg bg-[#061A35]/95 border-2 border-[#8CCDEB]/60 rounded-2xl shadow-[0_0_40px_rgba(5,7,11,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-[#0B315A] flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#107E57]" />
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wider text-[#F4F7FA]">
                    SOLO AI TRAINING
                  </h3>
                  <p className="text-[10px] text-[#8CCDEB]">
                    Offline tactical combat vs computer drone
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSoloModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              
              {/* Difficulty Selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  AI DIFFICULTY
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['EASY', 'NORMAL', 'HARD'] as CombatDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setAIDifficulty(diff)}
                      className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                        aiDifficulty === diff
                          ? diff === 'HARD'
                            ? 'border-red-500 bg-red-950/60 text-red-300 font-bold'
                            : diff === 'NORMAL'
                            ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] font-bold'
                            : 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-black">{diff}</p>
                      <p className="text-[8px] opacity-75">
                        {diff === 'EASY' ? 'Relaxed' : diff === 'NORMAL' ? 'Tactical' : 'Relentless'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Callsign */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  CALLSIGN
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Callsign"
                  maxLength={15}
                  className="w-full bg-[#05070B]/90 border border-[#8CCDEB]/40 focus:border-[#8CCDEB] p-2.5 rounded-lg text-xs font-bold text-[#F4F7FA] outline-none"
                />
              </div>

              {/* Hull Scheme */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  CHASSIS SCHEME
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CHASSIS_CONFIG) as BattleColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlayerColor(c)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer ${
                        playerColor === c
                          ? 'border-[#FFCC00] bg-[#FFB000]/15'
                          : 'border-[#0B315A] bg-[#05070B]/60'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: CHASSIS_CONFIG[c].hex }} />
                      <span className="text-[9px] uppercase font-bold text-[#F4F7FA]">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 pt-2 border-t border-[#0B315A] flex items-center justify-end gap-2.5 bg-[#08264A]/80">
              <button
                type="button"
                onClick={() => setSoloModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-slate-300 hover:text-white cursor-pointer"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleStartSolo}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#107E57] to-[#0B315A] hover:from-emerald-600 hover:to-[#0E3E73] border-2 border-emerald-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,126,87,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <Zap size={15} />
                <span>LAUNCH BATTLE</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
