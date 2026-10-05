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
  User,
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
  Info,
  Loader2,
  Play
} from 'lucide-react';
import { enterFullscreen, toggleFullscreen, useFullscreen } from '../../utils/fullscreenHelper';
import { getOptimalDPR, isMobileDevice } from '../../utils/mobileOptimization';

const CHASSIS_CONFIG: Record<BattleColor, { hex: string; label: string; scheme: SpaceshipPaintSchemeKey }> = {
  yellow: { hex: '#FFCC00', label: 'Solar Vanguard', scheme: 'battle_yellow' },
  blue: { hex: '#8CCDEB', label: 'Frost Interceptor', scheme: 'battle_blue' },
  red: { hex: '#ef4444', label: 'Crimson Raptor', scheme: 'battle_red' },
  green: { hex: '#107E57', label: 'Emerald Phantom', scheme: 'battle_green' }
};

const MODE_DESCRIPTIONS = {
  '1v1': '1v1 Orbital Duel — 2 Pilots duel to 250 HP elimination.',
  'FFA': '4-Player FFA — Free-for-all dogfight, last survivor wins.',
  '2v2': '2v2 Squad Strike — 2 vs 2 coordinated team battle.'
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
    setServerUrl,
    isServerOnline,
    checkServerReachability,
    startSoloGame
  } = useMultiplayerStore();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [soloModalOpen, setSoloModalOpen] = useState(false);
  const [intelDrawerOpen, setIntelDrawerOpen] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [createCode, setCreateCode] = useState(() => generateRoomCode());
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMuted, setIsMuted] = useState(() => nexusAudio.getMuted());
  
  const { isFullscreen } = useFullscreen();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    checkServerReachability();
    const interval = setInterval(() => {
      checkServerReachability();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkServerReachability, serverUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const effectiveName = playerName.trim() || 'Cadet-01';

  // Smooth, direct Room Creation
  const handleDirectCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    nexusAudio.playConfirm();
    const success = await createRoom(effectiveName, playerColor, gameMode, createCode);
    setIsCreating(false);
    if (!success) {
      // Regenerate fresh code for next try
      setCreateCode(generateRoomCode());
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || isJoining) return;
    setIsJoining(true);
    setError(null);
    nexusAudio.playConfirm();
    const success = await joinRoom(joinCode.trim().toUpperCase(), effectiveName, playerColor);
    setIsJoining(false);
    if (success) {
      setJoinModalOpen(false);
    }
  };

  const handleStartSolo = () => {
    nexusAudio.playConfirm();
    setSoloModalOpen(false);
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
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#05070B] font-mono text-[#F4F7FA] select-none flex flex-col justify-between p-2 sm:p-4 md:p-6">
      
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

        {/* Controlled Midnight Black & Deep Navy Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070B]/90 via-[#061A35]/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B]/85 via-transparent to-[#05070B]/40 pointer-events-none" />
      </div>

      {/* =========================================================================
          2. TOP HEADER HUD
          ========================================================================= */}
      <header className="relative z-20 flex items-center justify-between w-full shrink-0 mb-1 sm:mb-2 pointer-events-auto">
        {/* Logo & Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src={`${import.meta.env.BASE_URL}app-icon.png`} 
            alt="Space Colony Frontier Emblem" 
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg border border-[#8CCDEB]/40 shadow-[0_0_15px_rgba(140,205,235,0.25)] object-cover" 
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

        {/* Right Status & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Server Connectivity Status (ONLINE / OFFLINE) */}
          <div 
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#061A35]/85 border border-[#8CCDEB]/30 backdrop-blur-md text-[9px] sm:text-[10px] text-[#F4F7FA] shadow-sm select-none"
            title={isServerOnline === false ? 'Multiplayer Server: OFFLINE' : isServerOnline === true ? 'Multiplayer Server: ONLINE' : 'Checking Server Status...'}
          >
            <span className={`w-2 h-2 rounded-full ${
              isServerOnline === false 
                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                : isServerOnline === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="font-bold tracking-wider">
              {isServerOnline === false ? 'OFFLINE' : isServerOnline === true ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>

          <button 
            onClick={toggleAudio} 
            className="p-1.5 sm:p-2 rounded-lg bg-[#061A35]/80 hover:bg-[#0B315A] border border-[#8CCDEB]/30 text-[#8CCDEB] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button 
            onClick={toggleFullscreen} 
            className="p-1.5 sm:p-2 rounded-lg bg-[#061A35]/80 hover:bg-[#0B315A] border border-[#8CCDEB]/30 text-[#8CCDEB] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN RESPONSIVE BATTLE ARENA DISPLAY:
             - Desktop: 40% Left Controls / 60% Right 3D Spaceship
             - Landscape Mobile: Side-by-Side 50/50, top-aligned scrollable controls
             - Portrait Mobile: Pilot Profile & Actions at TOP (Guaranteed Visible), 3D Spaceship below
          ========================================================================= */}
      <main className="relative z-10 flex-1 w-full min-h-0 grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 items-start md:items-center my-0 md:my-auto pointer-events-none gap-2 sm:gap-4 overflow-hidden">
        
        {/* ========================================================
            LEFT COLUMN: FULLY SCROLLABLE DETAILS & GAME ACTIONS
            - order-1 on ALL screens guarantees Pilot Name is visible at top!
            ======================================================== */}
        <div 
          className="md:col-span-5 landscape:col-span-5 flex flex-col justify-start gap-2 sm:gap-2.5 z-20 pointer-events-auto max-w-md w-full h-full max-h-full overflow-y-auto overscroll-contain touch-pan-y scroll-touch pr-1 sm:pr-2 order-1 md:order-1 landscape:order-1"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          
          {/* 1. Pilot Profile Card - High Visibility Pilot Name & Callsign */}
          <div className="bg-[#061A35]/95 border-2 border-[#8CCDEB] rounded-xl p-2.5 sm:p-3.5 backdrop-blur-md shadow-[0_0_20px_rgba(140,205,235,0.25)] shrink-0">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#0B315A]">
              <span className="text-[10px] sm:text-[11px] font-black text-[#8CCDEB] uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={13} className="text-[#FFCC00] animate-pulse" />
                <span>PILOT PROFILE</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-[#107E57]/30 border border-[#107E57]/60 text-emerald-300 font-black uppercase tracking-wider">
                ACTIVE
              </span>
            </div>

            {/* Enter Pilot Name / Callsign - Maximum Contrast & Mobile Legibility */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] sm:text-xs font-black uppercase text-[#FFCC00] tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-[#FFCC00]" />
                  <span>PILOT CALLSIGN / NAME:</span>
                </label>
                <span className="text-[9px] text-[#8CCDEB]/80 font-mono">
                  {playerName.trim() ? `${playerName.length}/15` : 'Required'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter pilot callsign..."
                  maxLength={15}
                  className="w-full bg-[#05070B] border-2 border-[#8CCDEB] focus:border-[#FFCC00] focus:ring-2 focus:ring-[#FFCC00]/30 px-3.5 py-2 sm:py-2.5 rounded-xl text-base font-black text-white placeholder:text-slate-500 outline-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] transition-all"
                />
                {playerName && (
                  <button
                    type="button"
                    onClick={() => setPlayerName('')}
                    className="absolute right-2.5 px-1.5 py-0.5 text-xs text-slate-400 hover:text-white rounded cursor-pointer"
                    title="Clear Callsign"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Hull Scheme Selector */}
            <div>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#8CCDEB]/80 uppercase tracking-widest mb-1 font-bold">
                <span>CHASSIS PAINT</span>
                <span className="text-[#FFCC00] font-black">{CHASSIS_CONFIG[playerColor].label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
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
                      className={`py-1 px-1 rounded-md border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#FFCC00] bg-[#FFB000]/20 text-[#FFCC00] shadow-[0_0_10px_rgba(255,204,0,0.35)] font-black'
                          : 'border-[#0B315A] bg-[#05070B]/70 text-slate-400 hover:border-[#8CCDEB]/40'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: CHASSIS_CONFIG[c].hex }} />
                      <span className="text-[9px] uppercase font-bold">{c.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Combat Mode Selector with top-right 'i' info popover */}
          <div className="bg-[#061A35]/85 border border-[#8CCDEB]/35 rounded-xl p-2 sm:p-2.5 backdrop-blur-md shadow-md shrink-0 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-[#8CCDEB] uppercase tracking-wider">
                COMBAT DOCTRINE
              </span>
              <button
                type="button"
                onClick={() => setShowModeInfo(!showModeInfo)}
                className="text-[#FFCC00] hover:text-[#FFB000] p-0.5 rounded cursor-pointer"
                title="Combat Mode Info"
              >
                <Info size={13} />
              </button>
            </div>

            {/* Info Popover */}
            {showModeInfo && (
              <div className="p-2 mb-2 bg-[#05070B] border border-[#8CCDEB]/40 rounded-lg text-[10px] text-slate-300 leading-tight">
                {MODE_DESCRIPTIONS[gameMode]}
              </div>
            )}

            {/* Clean Mode Buttons (No extra descriptive text inside buttons) */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setGameMode('1v1');
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gameMode === '1v1'
                    ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] shadow-[0_0_12px_rgba(140,205,235,0.3)] font-black'
                    : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                }`}
              >
                <Swords size={13} className={gameMode === '1v1' ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                <span className="text-[11px] font-black tracking-wider">1V1</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1100);
                  setGameMode('FFA');
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gameMode === 'FFA'
                    ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] shadow-[0_0_12px_rgba(140,205,235,0.3)] font-black'
                    : 'border-[#0B315A] bg-[#05070B]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                }`}
              >
                <Crosshair size={13} className={gameMode === 'FFA' ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                <span className="text-[11px] font-black tracking-wider">FFA</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1200);
                  setGameMode('2v2');
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gameMode === '2v2'
                    ? 'border-[#8CCDEB] bg-[#0B315A] text-[#F4F7FA] shadow-[0_0_12px_rgba(140,205,235,0.3)] font-black'
                    : 'border-[#0B315A] bg-[#061A35]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                }`}
              >
                <Shield size={13} className={gameMode === '2v2' ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                <span className="text-[11px] font-black tracking-wider">2V2</span>
              </button>
            </div>
          </div>

          {/* 3. Stable Room Code Preview Box */}
          <div className="bg-[#05070B]/80 border border-[#8CCDEB]/30 rounded-xl p-2 sm:p-2.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-[#8CCDEB]">SECTOR KEY:</span>
              <span className="font-black text-sm sm:text-base text-[#FFCC00] tracking-widest">{createCode}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2 py-1 rounded bg-[#061A35] hover:bg-[#0B315A] border border-[#8CCDEB]/40 text-[#8CCDEB] text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy Room Key"
              >
                {copiedCode ? <Check size={12} className="text-[#22c55e]" /> : <Copy size={12} />}
                <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateCode(generateRoomCode());
                  nexusAudio.playClick(1100);
                }}
                className="p-1 rounded bg-[#061A35] hover:bg-[#0B315A] border border-[#8CCDEB]/40 text-[#FFCC00] cursor-pointer transition-colors"
                title="Regenerate Sector Key"
              >
                <RotateCw size={12} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2 sm:p-2.5 bg-[#05070B]/95 border border-red-500/80 rounded-xl text-red-300 text-[10px] sm:text-[11px] flex flex-col gap-1.5 shadow-xl shrink-0">
              <div className="flex items-start gap-1.5">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1 leading-snug">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 font-bold hover:bg-white/10 px-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={handleDirectCreate}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                >
                  Retry Connection
                </button>
                <button
                  type="button"
                  onClick={handleStartSolo}
                  className="px-2.5 py-1 bg-[#107E57] hover:bg-emerald-600 text-white rounded font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                >
                  Play Solo vs AI Drone
                </button>
              </div>
            </div>
          )}

          {/* 4. Primary Game Action Buttons (Guaranteed Visible on Mobile & Landscape) */}
          <div className="flex flex-col gap-2 shrink-0 pt-0.5">
            
            {/* [ CREATE ROOM ] - Primary CTA */}
            <button
              type="button"
              onClick={handleDirectCreate}
              disabled={isCreating}
              className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0B315A] via-[#08264A] to-[#0B315A] hover:from-[#0E3E73] hover:to-[#0E3E73] active:scale-[0.99] border-2 border-[#8CCDEB] text-[#F4F7FA] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(140,205,235,0.25)] flex items-center justify-center gap-2 cursor-pointer group"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="text-[#FFCC00] animate-spin" />
                  <span>CREATING ROOM...</span>
                </>
              ) : (
                <>
                  <Users size={16} className="text-[#FFCC00] group-hover:scale-110 transition-transform" />
                  <span>CREATE ROOM</span>
                </>
              )}
            </button>

            {/* 2-Column Action Grid: [ JOIN ROOM ] & [ SOLO MODE ] SIDE-BY-SIDE */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* [ JOIN ROOM ] */}
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setJoinModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#05070B]/85 hover:bg-[#061A35] active:scale-[0.99] border border-[#8CCDEB]/60 hover:border-[#8CCDEB] text-[#8CCDEB] hover:text-[#F4F7FA] font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight size={14} />
                <span>JOIN ROOM</span>
              </button>

              {/* [ SOLO MODE ] - ALWAYS VISIBLE */}
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(900);
                  setSoloModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#107E57]/20 hover:bg-[#107E57]/40 active:scale-[0.99] border border-[#107E57]/60 hover:border-emerald-400 text-emerald-300 hover:text-white font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(16,126,87,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot size={15} className="text-[#22c55e]" />
                <span>SOLO MODE</span>
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN: 3D HERO SPACESHIP & SPACE ENVIRONMENT (60%)
            ======================================================== */}
        <div className="md:col-span-7 landscape:col-span-7 h-[150px] sm:h-[220px] md:h-full landscape:h-full flex items-center justify-center relative order-2 md:order-2 landscape:order-2 pointer-events-auto shrink-0">
          
          {/* Holographic Aerospace Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-40">
            <div className="w-[180px] h-[180px] sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px] rounded-full border border-[#8CCDEB]/20 animate-[spin_80s_linear_infinite]" />
            <div className="absolute w-[130px] h-[130px] sm:w-[240px] sm:h-[240px] md:w-[300px] md:h-[300px] rounded-full border border-dashed border-[#8CCDEB]/25 animate-[spin_50s_linear_infinite_reverse]" />
          </div>

          {/* Three.js Interactive 3D Canvas */}
          <div className="w-full h-full max-h-[58vh] aspect-square flex items-center justify-center relative">
            <Canvas 
              dpr={getOptimalDPR()}
              camera={{ position: [0, 1.4, 4.8], fov: 45 }} 
              gl={{ 
                alpha: true, 
                antialias: !isMobileDevice(),
                powerPreference: 'high-performance',
                stencil: false,
                depth: true
              }}
              className="w-full h-full z-10 relative cursor-grab active:cursor-grabbing touch-none select-none"
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
          <div className="absolute bottom-1 right-1 text-right pointer-events-none font-mono text-[9px] text-[#8CCDEB]/60 hidden sm:block">
            <p>SECTOR // FRONTIER-04</p>
            <p className="text-[#FFCC00]/70">ARENA 300M READY</p>
          </div>

        </div>

      </main>

      {/* =========================================================================
          4. BOTTOM HUD / TACTICAL INTEL TRIGGER
          ========================================================================= */}
      <footer className="relative z-20 w-full flex items-center justify-between pointer-events-auto border-t border-[#0B315A]/60 pt-1.5 sm:pt-2 text-[9px] sm:text-[10px] text-[#8CCDEB]/70 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#107E57]" />
          <span className="hidden sm:inline font-mono">WASD / JOYSTICK TO FLY • MOUSE / TOUCH TO FIRE</span>
          <span className="sm:hidden font-mono">TOUCH JOYSTICK TO FLY</span>
        </div>

        {/* Toggle Tactical Intel Slide-up */}
        <button 
          onClick={() => setIntelDrawerOpen(!intelDrawerOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#061A35]/80 hover:bg-[#0B315A] border border-[#8CCDEB]/30 text-[#F4F7FA] font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Info size={11} className="text-[#FFCC00]" />
          <span>TACTICAL INTEL</span>
          {intelDrawerOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>

        <div className="hidden sm:block text-[#8CCDEB]/60">
          SYS // 60HZ TICK • V2.4.0
        </div>
      </footer>

      {/* =========================================================================
          5. TACTICAL INTEL DRAWER (SLIDE-UP MODAL)
          ========================================================================= */}
      {intelDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-[#05070B]/80 backdrop-blur-md flex items-end justify-center animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-4xl bg-[#061A35]/95 border-t-2 border-[#8CCDEB] rounded-t-2xl p-4 sm:p-6 max-h-[75vh] overflow-y-auto overscroll-contain shadow-2xl flex flex-col gap-4 text-[#F4F7FA]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#0B315A]">
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-wider text-[#F4F7FA]">
                  TACTICAL INTEL & DOCTRINES
                </h3>
                <p className="text-[10px] text-[#8CCDEB] uppercase tracking-widest">
                  Authoritative combat parameters & operational rules
                </p>
              </div>
              <button 
                onClick={() => setIntelDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#0B315A] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#0B315A]">
                <div className="text-[#FFCC00] font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Zap size={14} /> RAPID PLASMA BOLTS
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  260 m/s high-velocity authoritative bullets. 30 round capacity with 2.0s automatic reload cycle.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#0B315A]">
                <div className="text-[#8CCDEB] font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Crosshair size={14} /> DIRECTED LASER BEAM
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  12 HP instantaneous directed beam with 3.0s recharge interval. Lock on with generous target cone.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#0B315A]">
                <div className="text-amber-400 font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Radio size={14} /> HIGH-YIELD SOLAR BURST
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  30 HP heavy piercing blast with 10.0s cooldown. Devastating punch through asteroid cover.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#08264A]/60 border border-[#8CCDEB]/20 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Authoritative Colyseus Server • 60Hz State Synchronization</span>
              <button
                onClick={() => setIntelDrawerOpen(false)}
                className="px-3 py-1 bg-[#0B315A] hover:bg-[#0E3E73] text-[#F4F7FA] font-bold uppercase rounded-lg text-[10px] cursor-pointer"
              >
                Close Intel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. JOIN ROOM GAME MODAL (MIDNIGHT BLACK + DEEP NAVY + CYAN)
          ========================================================================= */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070B]/85 backdrop-blur-md animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-lg bg-[#061A35]/95 border-2 border-[#8CCDEB]/60 rounded-2xl shadow-[0_0_40px_rgba(5,7,11,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-[#0B315A] flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-[#8CCDEB]" />
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wider text-[#F4F7FA]">
                    JOIN FRONTIER MATCH
                  </h3>
                  <p className="text-[10px] text-[#8CCDEB]">
                    Connect to an existing squad sector
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
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
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
                  autoFocus
                  className="w-full bg-[#05070B] border-2 border-[#8CCDEB] focus:border-[#FFCC00] p-2.5 sm:p-3 rounded-xl text-center text-xl sm:text-2xl font-black tracking-[0.3em] text-[#FFCC00] outline-none shadow-[0_0_15px_rgba(140,205,235,0.25)] transition-all uppercase placeholder:text-slate-600"
                />
              </div>

              {/* Callsign */}
              <div>
                <label className="block text-[11px] sm:text-xs font-black uppercase text-[#FFCC00] tracking-wider mb-1 flex items-center gap-1.5">
                  <User size={14} className="text-[#FFCC00]" />
                  <span>ENTER PILOT NAME / CALLSIGN</span>
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your pilot callsign..."
                  maxLength={15}
                  className="w-full bg-[#05070B] border-2 border-[#8CCDEB] focus:border-[#FFCC00] px-3.5 py-2.5 rounded-xl text-base font-black text-white placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>

              {joinCode.trim().length > 0 && joinCode.trim().length < 4 && (
                <p className="text-[10px] text-amber-400">
                  Room code must be 4 to 6 characters.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 pt-2 border-t border-[#0B315A] flex items-center justify-end gap-2 bg-[#08264A]/80">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-slate-300 hover:text-white cursor-pointer"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4 || isJoining}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B315A] to-[#08264A] hover:from-[#0E3E73] hover:to-[#0E3E73] disabled:opacity-40 border-2 border-[#8CCDEB] text-[#F4F7FA] font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(140,205,235,0.3)] flex items-center gap-1.5 cursor-pointer"
              >
                {isJoining ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#8CCDEB]" />
                    <span>CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} />
                    <span>ENTER SECTOR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. SOLO AI TRAINING MODAL
          ========================================================================= */}
      {soloModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070B]/85 backdrop-blur-md animate-fadeIn pointer-events-auto">
          <div 
            className="w-full max-w-lg bg-[#061A35]/95 border-2 border-emerald-500/60 rounded-2xl shadow-[0_0_40px_rgba(5,7,11,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-[#0B315A] flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#22c55e]" />
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wider text-[#F4F7FA]">
                    SOLO AI TRAINING
                  </h3>
                  <p className="text-[10px] text-emerald-400">
                    Offline tactical combat vs autonomous drone (Zero lag)
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
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
              {/* Difficulty Selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8CCDEB] mb-1.5">
                  DRONE COMBAT PROTOCOL
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
                <label className="block text-[11px] sm:text-xs font-black uppercase text-[#FFCC00] tracking-wider mb-1 flex items-center gap-1.5">
                  <User size={14} className="text-[#FFCC00]" />
                  <span>ENTER PILOT NAME / CALLSIGN</span>
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your pilot callsign..."
                  maxLength={15}
                  className="w-full bg-[#05070B] border-2 border-[#8CCDEB] focus:border-[#FFCC00] px-3.5 py-2.5 rounded-xl text-base font-black text-white placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 pt-2 border-t border-[#0B315A] flex items-center justify-end gap-2 bg-[#08264A]/80">
              <button
                type="button"
                onClick={() => setSoloModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-slate-300 hover:text-white cursor-pointer"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleStartSolo}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#107E57] to-[#0B315A] hover:from-emerald-600 hover:to-[#0E3E73] border-2 border-emerald-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,126,87,0.4)] flex items-center gap-1.5 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>LAUNCH BATTLE</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
