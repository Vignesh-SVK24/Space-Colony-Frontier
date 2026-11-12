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
  X,
  AlertCircle,
  Info,
  Loader2,
  Play,
  ShieldCheck,
  Gamepad2
} from 'lucide-react';
import { PilotAuthModal } from './PilotAuthModal';
import { toggleFullscreen, useFullscreen } from '../../utils/fullscreenHelper';
import { getOptimalDPR, isMobileDevice } from '../../utils/mobileOptimization';

const CHASSIS_CONFIG: Record<BattleColor, { hex: string; label: string; name: string; scheme: SpaceshipPaintSchemeKey }> = {
  yellow: { hex: '#FFCC00', label: 'Yellow', name: 'Solar Vanguard', scheme: 'battle_yellow' },
  blue: { hex: '#8CCDEB', label: 'Blue', name: 'Frost Interceptor', scheme: 'battle_blue' },
  red: { hex: '#ef4444', label: 'Red', name: 'Crimson Raptor', scheme: 'battle_red' },
  green: { hex: '#107E57', label: 'Green', name: 'Emerald Phantom', scheme: 'battle_green' }
};

const MODE_DESCRIPTIONS = {
  '1v1': '1v1 Orbital Duel — 2 pilots battle to 250 HP elimination.',
  'FFA': '4-Player Free-For-All — Every pilot for themselves, last survivor wins.',
  '2v2': '2v2 Team Battle — Coordinated 2 vs 2 squad combat.'
};

const RotatingHeroShip: React.FC<{ scheme: SpaceshipPaintSchemeKey }> = ({ scheme }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
      groupRef.current.position.y = Math.sin(Date.now() * 0.0015) * 0.1 - 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]} rotation={[0.18, 0, 0]}>
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
    startSoloGame,
    authUser,
    setAuthModalOpen,
    initAuth
  } = useMultiplayerStore();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [soloModalOpen, setSoloModalOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<'INFO' | 'CONTROLS' | null>(null);
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
    initAuth();
  }, [initAuth]);

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

  const handleDirectCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    nexusAudio.playConfirm();
    const success = await createRoom(effectiveName, playerColor, gameMode, createCode);
    setIsCreating(false);
    if (!success) {
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
    <div
      className="fixed inset-0 h-[100dvh] w-screen overflow-y-auto overflow-x-hidden lg:overflow-hidden scroll-touch bg-[#05070B] font-mono text-[#F4F7FA] select-none flex flex-col lg:justify-between p-2.5 sm:p-4 lg:p-6"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))'
      }}
    >
      {/* Background Cinematic Space Vista */}
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

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070B]/90 via-[#061A35]/45 to-[#05070B]/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070B]/85 via-transparent to-[#05070B]/40 pointer-events-none" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between w-full shrink-0 mb-3 sm:mb-4 pb-2.5 border-b border-[#8CCDEB]/15 pointer-events-auto">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src={`${import.meta.env.BASE_URL}app-icon.png`}
            alt="Space Colony: Frontier"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-[#8CCDEB]/40 shadow-[0_0_12px_rgba(140,205,235,0.2)] object-cover shrink-0"
          />
          <div className="flex flex-wrap items-baseline gap-x-1.5 leading-tight min-w-0">
            <span className="text-sm sm:text-lg font-black tracking-wider text-[#F4F7FA]">SPACE COLONY</span>
            <span className="text-sm sm:text-lg font-black tracking-wider text-[#FFCC00]">FRONTIER</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#061A35]/85 border border-[#8CCDEB]/25 backdrop-blur-md text-[10px] text-[#F4F7FA]"
            title={isServerOnline === false ? 'Server Offline' : isServerOnline === true ? 'Server Online' : 'Connecting...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isServerOnline === false
                  ? 'bg-red-500'
                  : isServerOnline === true
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-semibold">
              {isServerOnline === false ? 'Offline' : isServerOnline === true ? 'Online' : 'Connecting'}
            </span>
          </div>

          <button
            onClick={toggleAudio}
            className="p-1.5 sm:p-2 rounded-lg bg-[#061A35]/80 hover:bg-[#08264A] border border-[#8CCDEB]/25 text-[#8CCDEB] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-lg bg-[#061A35]/80 hover:bg-[#08264A] border border-[#8CCDEB]/25 text-[#8CCDEB] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </header>

      {/* Main Two-Section Game Menu Layout */}
      <main className="relative z-10 w-full lg:flex-1 lg:min-h-0 flex flex-col md:grid md:grid-cols-12 items-stretch md:items-center gap-3 sm:gap-4 lg:gap-6 pb-6 lg:pb-0">
        
        {/* LEFT SECTION (45% Desktop / Lower Section on Mobile): Pilot Profile & Primary Game Actions */}
        <div className="md:col-span-5 flex flex-col justify-start lg:justify-center gap-2.5 sm:gap-3 z-20 pointer-events-auto max-w-md w-full mx-auto md:mx-0 order-2 md:order-1">
          
          {/* 1. Compact Pilot Profile Card (No Ship Colour Control Here) */}
          <div className="bg-[#061A35]/90 border border-[#8CCDEB]/40 rounded-xl p-3 sm:p-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#8CCDEB]/15">
              <span className="text-xs font-bold text-[#8CCDEB] flex items-center gap-1.5">
                <User size={14} className="text-[#FFCC00]" />
                <span>Pilot Profile</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setAuthModalOpen(true);
                }}
                className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  authUser && !authUser.isGuest
                    ? 'bg-[#107E57]/35 border-[#107E57] text-emerald-300'
                    : 'bg-[#08264A] border-[#8CCDEB]/35 text-[#8CCDEB] hover:text-[#FFCC00] hover:border-[#FFCC00]/50'
                }`}
              >
                <ShieldCheck size={12} />
                <span>{authUser && !authUser.isGuest ? 'Verified' : 'Sign In'}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#F4F7FA]">
                  Pilot Name
                </label>
                {authUser && !authUser.isGuest && authUser.stats && (
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    {authUser.stats.matchesWon} Wins · {authUser.stats.kills} Eliminations
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter pilot name..."
                  maxLength={15}
                  className="w-full bg-[#05070B] border border-[#8CCDEB]/50 focus:border-[#FFCC00] px-3 py-2 rounded-lg text-sm font-bold text-white placeholder:text-slate-500 outline-none transition-colors"
                />
                {playerName && (
                  <button
                    type="button"
                    onClick={() => setPlayerName('')}
                    className="absolute right-2 px-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    title="Clear Name"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Game Mode & Room Code */}
          <div className="bg-[#061A35]/85 border border-[#8CCDEB]/30 rounded-xl p-3 backdrop-blur-md shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8CCDEB]">Game Mode</span>
              <button
                type="button"
                onClick={() => setShowModeInfo(!showModeInfo)}
                className="text-[#FFCC00] hover:text-[#FFB000] p-0.5 rounded cursor-pointer"
                title="Mode Details"
              >
                <Info size={13} />
              </button>
            </div>

            {showModeInfo && (
              <div className="p-2 bg-[#05070B] border border-[#8CCDEB]/30 rounded-lg text-[10px] text-slate-300 leading-snug">
                {MODE_DESCRIPTIONS[gameMode]}
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5">
              {(['1v1', 'FFA', '2v2'] as const).map((mode) => {
                const active = gameMode === mode;
                const Icon = mode === '1v1' ? Swords : mode === 'FFA' ? Crosshair : Shield;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      nexusAudio.playClick(1050);
                      setGameMode(mode);
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      active
                        ? 'border-[#8CCDEB] bg-[#08264A] text-[#F4F7FA] font-black shadow-sm'
                        : 'border-[#08264A] bg-[#05070B]/60 text-slate-400 hover:border-[#8CCDEB]/30'
                    }`}
                  >
                    <Icon size={13} className={active ? 'text-[#8CCDEB]' : 'text-slate-500'} />
                    <span className="text-xs font-bold">{mode === 'FFA' ? 'FFA' : mode}</span>
                  </button>
                );
              })}
            </div>

            {/* Compact Room Code Row */}
            <div className="flex items-center justify-between pt-2 border-t border-[#8CCDEB]/15">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8CCDEB]/80 font-semibold">Room Code:</span>
                <span className="font-black text-sm text-[#FFCC00] tracking-widest">{createCode}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2 py-1 rounded bg-[#05070B] hover:bg-[#08264A] border border-[#8CCDEB]/30 text-[#8CCDEB] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateCode(generateRoomCode());
                    nexusAudio.playClick(1100);
                  }}
                  className="p-1 rounded bg-[#05070B] hover:bg-[#08264A] border border-[#8CCDEB]/30 text-[#FFCC00] cursor-pointer transition-colors"
                  title="New Room Code"
                >
                  <RotateCw size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 bg-[#05070B]/95 border border-red-500/70 rounded-xl text-red-300 text-[11px] flex flex-col gap-1.5">
              <div className="flex items-start gap-1.5">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 font-bold px-1 cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectCreate}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] cursor-pointer"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={handleStartSolo}
                  className="px-2.5 py-1 bg-[#107E57] hover:bg-emerald-600 text-white rounded font-bold text-[10px] cursor-pointer"
                >
                  Play Solo
                </button>
              </div>
            </div>
          )}

          {/* 3. Primary Actions: Create Room, Join Room, Solo Practice */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDirectCreate}
              disabled={isCreating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#08264A] to-[#0D3B73] hover:from-[#0D3B73] hover:to-[#134E96] active:scale-[0.99] border border-[#8CCDEB] text-[#F4F7FA] font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_16px_rgba(140,205,235,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="text-[#FFCC00] animate-spin" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <>
                  <Users size={16} className="text-[#FFCC00]" />
                  <span>Create Room</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setJoinModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#05070B]/85 hover:bg-[#061A35] active:scale-[0.99] border border-[#8CCDEB]/50 hover:border-[#8CCDEB] text-[#8CCDEB] hover:text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight size={14} />
                <span>Join Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(900);
                  setSoloModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#107E57]/25 hover:bg-[#107E57]/45 active:scale-[0.99] border border-[#107E57]/70 hover:border-emerald-400 text-emerald-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot size={14} className="text-emerald-400" />
                <span>Solo Practice</span>
              </button>
            </div>
          </div>

          {/* 4. Compact Navigation Links */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-[#8CCDEB]/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setInfoModalTab('INFO');
                }}
                className="hover:text-[#FFCC00] transition-colors flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Info size={12} />
                <span>Game Info</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  nexusAudio.playClick(1000);
                  setInfoModalTab('CONTROLS');
                }}
                className="hover:text-[#FFCC00] transition-colors flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Gamepad2 size={12} />
                <span>Controls</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                nexusAudio.playClick(1000);
                setAuthModalOpen(true);
              }}
              className="hover:text-[#FFCC00] transition-colors cursor-pointer font-semibold"
            >
              Pilot Profile
            </button>
          </div>
        </div>

        {/* RIGHT SECTION (55% Desktop / Top Showcase on Mobile): Large 3D Spaceship & Ship Colour Selector */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative order-1 md:order-2 pointer-events-auto max-w-md md:max-w-none w-full mx-auto lg:h-full lg:min-h-0 gap-2">
          
          {/* 3D Spaceship Preview Container */}
          <div
            className="landing-ship-canvas relative w-full h-[135px] sm:h-[190px] md:h-[220px] lg:flex-1 lg:min-h-0 lg:max-h-[55vh] flex items-center justify-center"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Subtle Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-30">
              <div className="w-[125px] h-[125px] sm:w-[180px] sm:h-[180px] lg:w-[340px] lg:h-[340px] rounded-full border border-[#8CCDEB]/25 animate-[spin_80s_linear_infinite]" />
              <div className="absolute w-[90px] h-[90px] sm:w-[130px] sm:h-[130px] lg:w-[250px] lg:h-[250px] rounded-full border border-dashed border-[#8CCDEB]/30 animate-[spin_50s_linear_infinite_reverse]" />
            </div>

            <Canvas
              dpr={getOptimalDPR()}
              camera={{ position: [0, 1.3, 4.6], fov: 45 }}
              gl={{
                alpha: true,
                antialias: !isMobileDevice(),
                powerPreference: 'high-performance',
                stencil: false,
                depth: true
              }}
              style={{ touchAction: 'pan-y' }}
              className="w-full h-full z-10 relative cursor-grab active:cursor-grabbing select-none"
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

          {/* Relocated Ship Colour Customization Directly Underneath the 3D Spaceship */}
          <div className="z-20 shrink-0 bg-[#061A35]/90 border border-[#8CCDEB]/40 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="text-[#8CCDEB] font-semibold">Ship Colour:</span>
              <span className="text-[#FFCC00] font-black">{CHASSIS_CONFIG[playerColor].name}</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {(Object.keys(CHASSIS_CONFIG) as BattleColor[]).map((c) => {
                const isSelected = playerColor === c;
                const cfg = CHASSIS_CONFIG[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      nexusAudio.playClick(1200);
                      setPlayerColor(c);
                    }}
                    title={`${cfg.label} — ${cfg.name}`}
                    className={`group relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#061A35] shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                        : 'opacity-75 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: cfg.hex }}
                  >
                    {isSelected && (
                      <Check size={14} className={c === 'yellow' || c === 'blue' ? 'text-[#05070B] stroke-[3]' : 'text-white stroke-[3]'} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </main>

      {/* Compact Info & Controls Modal */}
      {infoModalTab && (
        <div
          className="fixed inset-0 z-50 bg-[#05070B]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn pointer-events-auto"
          onClick={() => setInfoModalTab(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#061A35] border border-[#8CCDEB]/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-[#F4F7FA]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#8CCDEB]/20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInfoModalTab('INFO')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    infoModalTab === 'INFO' ? 'bg-[#08264A] text-[#FFCC00] border border-[#8CCDEB]/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Game Info
                </button>
                <button
                  type="button"
                  onClick={() => setInfoModalTab('CONTROLS')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    infoModalTab === 'CONTROLS' ? 'bg-[#08264A] text-[#FFCC00] border border-[#8CCDEB]/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Controls
                </button>
              </div>
              <button
                onClick={() => setInfoModalTab(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#08264A] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {infoModalTab === 'INFO' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#8CCDEB]/20">
                  <div className="text-[#FFCC00] font-bold text-xs mb-1 flex items-center gap-1.5">
                    <Zap size={14} /> Plasma Bullets
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    2 HP rapid-fire bolts with a 30-round magazine and 2.0s reload.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#8CCDEB]/20">
                  <div className="text-[#8CCDEB] font-bold text-xs mb-1 flex items-center gap-1.5">
                    <Crosshair size={14} /> Laser Beam
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    12 HP precision beam with a 3.0s recharge interval.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#8CCDEB]/20">
                  <div className="text-amber-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                    <Shield size={14} /> Solar Beam
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    30 HP high-yield energy burst with a 10.0s recharge interval.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#8CCDEB]/20 space-y-1.5">
                  <div className="text-[#FFCC00] font-bold mb-1">Desktop Controls</div>
                  <div><span className="text-[#8CCDEB] font-bold">W / S / A / D:</span> Thrust &amp; Turn</div>
                  <div><span className="text-[#8CCDEB] font-bold">Space / C (or Down):</span> Ascend / Descend</div>
                  <div><span className="text-[#8CCDEB] font-bold">Shift:</span> Boost</div>
                  <div><span className="text-[#8CCDEB] font-bold">Left Click / J:</span> Fire Bullets</div>
                  <div><span className="text-[#8CCDEB] font-bold">Right Click / K:</span> Fire Laser</div>
                  <div><span className="text-[#8CCDEB] font-bold">L:</span> Fire Solar Beam</div>
                  <div><span className="text-[#8CCDEB] font-bold">R / M / Tab:</span> Reload / Map / Scoreboard</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070B]/70 border border-[#8CCDEB]/20 space-y-1.5">
                  <div className="text-emerald-400 font-bold mb-1">Mobile Touch Controls</div>
                  <div><span className="text-[#8CCDEB] font-bold">Left Joystick:</span> Flight Thrust &amp; Steering</div>
                  <div><span className="text-[#8CCDEB] font-bold">Up / Down Pads:</span> Altitude Control</div>
                  <div><span className="text-[#8CCDEB] font-bold">Right Buttons:</span> Bullet, Laser, Solar &amp; Boost</div>
                  <div><span className="text-[#8CCDEB] font-bold">Swipe Screen:</span> Adjust Camera Aim</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {joinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070B]/85 backdrop-blur-md animate-fadeIn pointer-events-auto"
          onClick={() => setJoinModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#061A35] border border-[#8CCDEB]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#8CCDEB]/20 flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-[#8CCDEB]" />
                <h3 className="text-sm font-black tracking-wider text-[#F4F7FA]">Join Room</h3>
              </div>
              <button onClick={() => setJoinModalOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8CCDEB] mb-1.5">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  autoFocus
                  className="w-full bg-[#05070B] border border-[#8CCDEB] focus:border-[#FFCC00] p-3 rounded-xl text-center text-xl font-black tracking-[0.3em] text-[#FFCC00] outline-none uppercase placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#F4F7FA] mb-1.5">Pilot Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter pilot name..."
                  maxLength={15}
                  className="w-full bg-[#05070B] border border-[#8CCDEB]/60 focus:border-[#FFCC00] px-3.5 py-2.5 rounded-xl text-sm font-bold text-white placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#8CCDEB]/20 flex items-center justify-end gap-2 bg-[#08264A]/60">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4 || isJoining}
                className="px-5 py-2 rounded-xl bg-[#08264A] hover:bg-[#0D3B73] disabled:opacity-40 border border-[#8CCDEB] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                {isJoining ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#8CCDEB]" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} />
                    <span>Join Room</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solo Practice Modal */}
      {soloModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070B]/85 backdrop-blur-md animate-fadeIn pointer-events-auto"
          onClick={() => setSoloModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#061A35] border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#8CCDEB]/20 flex items-center justify-between bg-[#08264A]/80">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black tracking-wider text-[#F4F7FA]">Solo Practice</h3>
              </div>
              <button onClick={() => setSoloModalOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8CCDEB] mb-1.5">AI Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
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
                            ? 'border-[#8CCDEB] bg-[#08264A] text-white font-bold'
                            : 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'border-[#08264A] bg-[#05070B]/60 text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-black">{diff}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#F4F7FA] mb-1.5">Pilot Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter pilot name..."
                  maxLength={15}
                  className="w-full bg-[#05070B] border border-[#8CCDEB]/60 focus:border-[#FFCC00] px-3.5 py-2.5 rounded-xl text-sm font-bold text-white placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#8CCDEB]/20 flex items-center justify-end gap-2 bg-[#08264A]/60">
              <button
                type="button"
                onClick={() => setSoloModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSolo}
                className="px-5 py-2 rounded-xl bg-[#107E57] hover:bg-emerald-600 border border-emerald-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Launch Battle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pilot Authentication & Security Dossier Modal */}
      <PilotAuthModal />
    </div>
  );
};
