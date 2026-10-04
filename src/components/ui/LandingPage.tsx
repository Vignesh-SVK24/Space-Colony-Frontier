import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom, generateRoomCode } from '../../multiplayer/colyseusClient';
import { BattleColor, GameMode } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { CombatDifficulty } from '../../config/combatConfig';
import { nexusAudio } from '../../utils/nexusAudio';
import { 
  Users, 
  Bot, 
  Sparkles, 
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
  Menu,
  X,
  Crosshair,
  Radio,
  Layers,
  ChevronRight,
  Globe,
  Sliders,
  AlertCircle
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
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.position.y = Math.sin(Date.now() * 0.0016) * 0.12 - 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0]} rotation={[0.22, 0, 0]}>
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

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [soloModalOpen, setSoloModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const toggleAudio = () => {
    const muted = nexusAudio.toggleMute();
    setIsMuted(muted);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-y-auto overflow-x-hidden bg-[#F7FAFF] text-[#071A33] selection:bg-[#1677FF] selection:text-white scroll-smooth scroll-touch">
      
      {/* ==========================================
          LAYER 1: Cinematic Deep-Space Background (Behind UI)
          ========================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#061A35]">
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

        {/* Futuristic White + Space Blue Atmospheric Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#061A35]/35 via-[#EEF4FA]/85 to-[#FFFFFF] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_20%,_rgba(247,250,255,0.7)_70%,_#FFFFFF_100%)] pointer-events-none" />
      </div>

      {/* ==========================================
          LAYER 2: Foreground Interface
          ========================================== */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ---------------- TOP NAVIGATION ---------------- */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#EEF4FA] shadow-[0_2px_15px_rgba(10,40,80,0.04)] transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
            
            {/* Brand Logo & Name */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => scrollToSection('hero')}
            >
              <img 
                src={`${import.meta.env.BASE_URL}app-icon.png`} 
                alt="Space Colony Frontier Emblem" 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-[0_4px_12px_rgba(22,119,255,0.15)] border border-[#D5E3F2] object-cover group-hover:scale-105 transition-transform" 
              />
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-base sm:text-lg font-black tracking-wider text-[#061A35]">SPACE COLONY</span>
                  <span className="text-base sm:text-lg font-black tracking-wider text-[#1677FF]">FRONTIER</span>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#53657D] font-mono mt-0.5 hidden sm:block">
                  Aerospace Combat Operations
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold uppercase tracking-widest text-[#53657D]">
              <button 
                onClick={() => { nexusAudio.playClick(1000); scrollToSection('hero'); }} 
                className="hover:text-[#1677FF] transition-colors cursor-pointer relative py-1 hover:border-b-2 hover:border-[#1677FF]"
              >
                HOME
              </button>
              <button 
                onClick={() => { nexusAudio.playClick(1000); scrollToSection('modes'); }} 
                className="hover:text-[#1677FF] transition-colors cursor-pointer relative py-1 hover:border-b-2 hover:border-[#1677FF]"
              >
                GAME MODES
              </button>
              <button 
                onClick={() => { nexusAudio.playClick(1000); scrollToSection('features'); }} 
                className="hover:text-[#1677FF] transition-colors cursor-pointer relative py-1 hover:border-b-2 hover:border-[#1677FF]"
              >
                FEATURES
              </button>
              <button 
                onClick={() => { nexusAudio.playClick(1000); scrollToSection('about'); }} 
                className="hover:text-[#1677FF] transition-colors cursor-pointer relative py-1 hover:border-b-2 hover:border-[#1677FF]"
              >
                ABOUT
              </button>
            </nav>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Server Status Pill */}
              <div 
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF4FA] border border-[#D5E3F2] text-[10px] font-mono font-bold text-[#0A2850]"
                title={serverUrl}
              >
                <span className={`w-2 h-2 rounded-full ${isServerOnline === false ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{isServerOnline === false ? 'SERVER OFFLINE' : 'SERVER ONLINE'}</span>
              </div>

              {/* Audio Toggle */}
              <button 
                onClick={toggleAudio} 
                className="p-2.5 rounded-xl bg-[#EEF4FA] hover:bg-[#E0EBF7] border border-[#D5E3F2] text-[#0A2850] transition-colors cursor-pointer" 
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Fullscreen Toggle */}
              <button 
                onClick={toggleFullscreen} 
                className="p-2.5 rounded-xl bg-[#EEF4FA] hover:bg-[#E0EBF7] border border-[#D5E3F2] text-[#0A2850] transition-colors cursor-pointer" 
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>

              {/* Mobile Hamburger Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="md:hidden p-2.5 rounded-xl bg-[#EEF4FA] text-[#0A2850] border border-[#D5E3F2] cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white/95 border-b border-[#EEF4FA] px-6 py-5 space-y-4 font-mono text-xs uppercase tracking-widest text-[#061A35] shadow-xl animate-fadeIn backdrop-blur-md">
              <button 
                onClick={() => scrollToSection('hero')} 
                className="block w-full text-left py-2 hover:text-[#1677FF] font-bold"
              >
                HOME
              </button>
              <button 
                onClick={() => scrollToSection('modes')} 
                className="block w-full text-left py-2 hover:text-[#1677FF] font-bold"
              >
                GAME MODES
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className="block w-full text-left py-2 hover:text-[#1677FF] font-bold"
              >
                FEATURES
              </button>
              <button 
                onClick={() => scrollToSection('about')} 
                className="block w-full text-left py-2 hover:text-[#1677FF] font-bold"
              >
                ABOUT
              </button>
              <div className="pt-3 border-t border-[#EEF4FA] flex items-center justify-between text-[11px] text-[#53657D]">
                <span>Status:</span>
                <span className="font-bold text-emerald-600">{isServerOnline === false ? 'Offline' : 'Online'}</span>
              </div>
            </div>
          )}
        </header>

        {/* ---------------- HERO SECTION ---------------- */}
        <section id="hero" className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-10 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left z-10">
              
              {/* Futuristic Sub-Header Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#D5E3F2] shadow-[0_2px_8px_rgba(22,119,255,0.08)] text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#1677FF] self-center lg:self-start mb-4">
                <Sparkles size={13} className="text-[#1677FF] animate-spin" />
                <span>AEROSPACE FRONTIER // REALTIME 3D COMBAT</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-[#061A35]">
                SPACE COLONY <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1677FF] via-[#2F8CFF] to-[#48C7FF]">
                  FRONTIER
                </span>
              </h1>

              {/* Tagline & Subtitle */}
              <div className="mt-4 sm:mt-5 space-y-2">
                <p className="text-xs sm:text-sm font-black tracking-[0.25em] uppercase text-[#0A2850]">
                  ENTER THE FRONTIER. BUILD. EXPLORE. SURVIVE.
                </p>
                <p className="text-sm sm:text-base text-[#53657D] max-w-xl mx-auto lg:mx-0 font-sans leading-relaxed">
                  Command your spacecraft, explore a massive 3D frontier, and battle players across the galaxy in fast-paced authoritative combat.
                </p>
              </div>

              {/* Diagnostic Error Notice */}
              {error && (
                <div className="mt-4 p-3.5 bg-red-50/95 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between shadow-sm max-w-xl mx-auto lg:mx-0 text-left">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button 
                    onClick={() => setError(null)} 
                    className="text-red-500 font-bold ml-2 hover:bg-red-100 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Main Action Area (AAA Control Buttons) */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-4">
                
                {/* [ CREATE ROOM ] */}
                <button
                  onClick={() => {
                    nexusAudio.playClick(1200);
                    setCreateModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1677FF] hover:bg-[#2F8CFF] active:scale-[0.98] text-white font-black text-sm tracking-widest uppercase transition-all shadow-[0_10px_25px_rgba(22,119,255,0.35)] hover:shadow-[0_15px_30px_rgba(22,119,255,0.45)] hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3"
                >
                  <Users size={18} />
                  <span>CREATE ROOM</span>
                </button>

                {/* [ JOIN ROOM ] */}
                <button
                  onClick={() => {
                    nexusAudio.playClick(1000);
                    setJoinModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-[#1677FF] text-[#0A2850] hover:text-white active:scale-[0.98] border-2 border-[#1677FF] font-black text-sm tracking-widest uppercase transition-all shadow-[0_8px_20px_rgba(10,40,80,0.06)] hover:shadow-[0_12px_25px_rgba(22,119,255,0.25)] hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3 group"
                >
                  <ArrowRight size={18} className="text-[#1677FF] group-hover:text-white transition-colors" />
                  <span>JOIN ROOM</span>
                </button>

                {/* [ SOLO VS AI ] */}
                <button
                  onClick={() => {
                    nexusAudio.playClick(900);
                    setSoloModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-[#EEF4FA] active:scale-[0.98] text-[#53657D] hover:text-[#061A35] border border-[#D5E3F2] font-bold text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bot size={16} className="text-[#1677FF]" />
                  <span>SOLO VS AI</span>
                </button>
              </div>

              {/* Quick Spec Metrics Bar */}
              <div className="mt-8 pt-6 border-t border-[#EEF4FA] grid grid-cols-3 max-w-md mx-auto lg:mx-0 text-center lg:text-left gap-4 font-mono">
                <div>
                  <p className="text-[10px] text-[#53657D] uppercase tracking-widest">Max Pilots</p>
                  <p className="text-base sm:text-lg font-black text-[#061A35]">4 PLAYERS</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#53657D] uppercase tracking-widest">Physics Rate</p>
                  <p className="text-base sm:text-lg font-black text-[#1677FF]">60 HZ TICK</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#53657D] uppercase tracking-widest">Craft Vitals</p>
                  <p className="text-base sm:text-lg font-black text-[#061A35]">250 HP BASE</p>
                </div>
              </div>

            </div>

            {/* Right Spaceship Visual Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center order-1 lg:order-2 relative">
              
              {/* 3D Visual Stage with Holographic Ring */}
              <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[480px] aspect-square flex items-center justify-center">
                
                {/* Holographic Orbital Reticle (Behind Spaceship) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full border border-sky-400/25 animate-[spin_60s_linear_infinite]" />
                  <div className="absolute w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] rounded-full border border-dashed border-sky-500/30 animate-[spin_40s_linear_infinite_reverse]" />
                  <div className="absolute w-[160px] h-[160px] sm:w-[210px] sm:h-[210px] rounded-full border border-sky-300/20" />
                  
                  {/* Subtle Precision Crosshairs */}
                  <div className="absolute w-[320px] sm:w-[420px] h-px bg-gradient-to-r from-transparent via-sky-400/25 to-transparent" />
                  <div className="absolute h-[320px] sm:h-[420px] w-px bg-gradient-to-b from-transparent via-sky-400/25 to-transparent" />
                </div>

                {/* Three.js Interactive 3D Canvas */}
                <Canvas 
                  dpr={[1, 2]}
                  camera={{ position: [0, 1.6, 5.2], fov: 45 }} 
                  gl={{ alpha: true, antialias: true }}
                  className="w-full h-full z-10 relative cursor-grab active:cursor-grabbing"
                >
                  <ambientLight intensity={1.1} />
                  <directionalLight position={[6, 8, 5]} intensity={2.2} color="#ffffff" />
                  <spotLight position={[-5, 6, -3]} intensity={1.8} angle={0.6} penumbra={1} color={COLORS[playerColor].hex} />
                  <pointLight position={[0, -2, 4]} intensity={1.0} color="#48C7FF" />
                  <React.Suspense fallback={null}>
                    <RotatingShipPreview scheme={COLORS[playerColor].scheme} />
                  </React.Suspense>
                </Canvas>
              </div>

              {/* Hull Chassis Paint Scheme Selector Pill */}
              <div className="mt-1 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 border border-[#D5E3F2] shadow-[0_4px_16px_rgba(10,40,80,0.06)] backdrop-blur-md z-10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#53657D] px-2">CHASSIS:</span>
                {(Object.keys(COLORS) as BattleColor[]).map((c) => {
                  const isSelected = playerColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        nexusAudio.playClick(1200);
                        setPlayerColor(c);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1677FF] text-white shadow-sm scale-105'
                          : 'hover:bg-[#EEF4FA] text-[#53657D]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[c].hex }} />
                      <span className="hidden sm:inline">{c}</span>
                    </button>
                  );
                })}
              </div>

            </div>

          </div>
        </section>

        {/* ---------------- GAME MODES SECTION ---------------- */}
        <section id="modes" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FA] text-[#1677FF] text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mb-3">
              COMBAT THEATERS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#061A35] tracking-tight">
              GAME MODES
            </h2>
            <p className="text-sm text-[#53657D] mt-2 font-sans">
              Choose your engagement protocol. From offline tactical combat to 4-pilot squad dogfights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Mode 1: SOLO */}
            <div 
              onClick={() => {
                nexusAudio.playClick(1000);
                setSoloModalOpen(true);
              }}
              className="group p-6 rounded-2xl bg-white border border-[#EEF4FA] hover:border-[#1677FF]/60 shadow-[0_6px_20px_rgba(10,40,80,0.04)] hover:shadow-[0_12px_30px_rgba(22,119,255,0.12)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] group-hover:bg-[#1677FF] group-hover:text-white transition-colors flex items-center justify-center mb-4">
                  <Bot size={24} />
                </div>
                <h3 className="text-lg font-black text-[#061A35] tracking-wide mb-1">1. SOLO</h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Battle against adaptive computer AI with full 250 HP vitals and tactical weapon loadouts.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#EEF4FA] flex items-center justify-between text-xs font-mono font-bold text-[#1677FF]">
                <span>TRAINING MODE</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 2: 1 VS 1 */}
            <div 
              onClick={() => {
                nexusAudio.playClick(1100);
                setGameMode('1v1');
                setCreateModalOpen(true);
              }}
              className="group p-6 rounded-2xl bg-white border border-[#EEF4FA] hover:border-[#1677FF]/60 shadow-[0_6px_20px_rgba(10,40,80,0.04)] hover:shadow-[0_12px_30px_rgba(22,119,255,0.12)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] group-hover:bg-[#1677FF] group-hover:text-white transition-colors flex items-center justify-center mb-4">
                  <Swords size={24} />
                </div>
                <h3 className="text-lg font-black text-[#061A35] tracking-wide mb-1">2. 1 VS 1</h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Fight another player in a high-stakes dogfight duel inside the 300m asteroid barrier.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#EEF4FA] flex items-center justify-between text-xs font-mono font-bold text-[#1677FF]">
                <span>2 PLAYERS</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 3: FREE FOR ALL */}
            <div 
              onClick={() => {
                nexusAudio.playClick(1200);
                setGameMode('FFA');
                setCreateModalOpen(true);
              }}
              className="group p-6 rounded-2xl bg-white border border-[#EEF4FA] hover:border-[#1677FF]/60 shadow-[0_6px_20px_rgba(10,40,80,0.04)] hover:shadow-[0_12px_30px_rgba(22,119,255,0.12)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] group-hover:bg-[#1677FF] group-hover:text-white transition-colors flex items-center justify-center mb-4">
                  <Crosshair size={24} />
                </div>
                <h3 className="text-lg font-black text-[#061A35] tracking-wide mb-1">3. FREE FOR ALL</h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Up to 4 players engage in total deathmatch chaos. Eliminate targets to claim victory.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#EEF4FA] flex items-center justify-between text-xs font-mono font-bold text-[#1677FF]">
                <span>4 PLAYERS</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 4: 2 VS 2 */}
            <div 
              onClick={() => {
                nexusAudio.playClick(1300);
                setGameMode('2v2');
                setCreateModalOpen(true);
              }}
              className="group p-6 rounded-2xl bg-white border border-[#EEF4FA] hover:border-[#1677FF]/60 shadow-[0_6px_20px_rgba(10,40,80,0.04)] hover:shadow-[0_12px_30px_rgba(22,119,255,0.12)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] group-hover:bg-[#1677FF] group-hover:text-white transition-colors flex items-center justify-center mb-4">
                  <Shield size={24} />
                </div>
                <h3 className="text-lg font-black text-[#061A35] tracking-wide mb-1">4. 2 VS 2</h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Team-based spacecraft combat. Coordinate flanking runs with Team Alpha and Team Bravo.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#EEF4FA] flex items-center justify-between text-xs font-mono font-bold text-[#1677FF]">
                <span>SQUAD TEAMS</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </section>

        {/* ---------------- FEATURES SECTION ---------------- */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F7FAFF] to-[#FFFFFF] border-y border-[#EEF4FA]">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FA] text-[#1677FF] text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mb-3">
                SYSTEM CAPABILITIES
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#061A35] tracking-tight">
                THE FRONTIER AWAITS
              </h2>
              <p className="text-sm text-[#53657D] mt-2 font-sans">
                Engineered with high-velocity 3D flight mechanics, synchronized ballistics, and tactical dogfighting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Feature 1 */}
              <div className="p-7 rounded-2xl bg-white border border-[#EEF4FA] shadow-[0_4px_16px_rgba(10,40,80,0.03)] hover:border-[#1677FF]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] flex items-center justify-center mb-5">
                  <Radio size={22} />
                </div>
                <h3 className="text-base font-black text-[#061A35] uppercase tracking-wider mb-2">
                  REAL-TIME MULTIPLAYER
                </h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Play with friends across mobile, tablet, and PC instantly using private room codes.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-7 rounded-2xl bg-white border border-[#EEF4FA] shadow-[0_4px_16px_rgba(10,40,80,0.03)] hover:border-[#1677FF]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] flex items-center justify-center mb-5">
                  <Globe size={22} />
                </div>
                <h3 className="text-base font-black text-[#061A35] uppercase tracking-wider mb-2">
                  3D SPACE COMBAT
                </h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Fight inside a large interactive 3D environment with full 6-DOF aerospace motion and physics.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-7 rounded-2xl bg-white border border-[#EEF4FA] shadow-[0_4px_16px_rgba(10,40,80,0.03)] hover:border-[#1677FF]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] flex items-center justify-center mb-5">
                  <Layers size={22} />
                </div>
                <h3 className="text-base font-black text-[#061A35] uppercase tracking-wider mb-2">
                  TACTICAL COMBAT
                </h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Use asteroids and environmental structures as cover to break enemy radar locks and missile lines.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-7 rounded-2xl bg-white border border-[#EEF4FA] shadow-[0_4px_16px_rgba(10,40,80,0.03)] hover:border-[#1677FF]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] flex items-center justify-center mb-5">
                  <Zap size={22} />
                </div>
                <h3 className="text-base font-black text-[#061A35] uppercase tracking-wider mb-2">
                  MULTIPLE WEAPONS
                </h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Unleash rapid 260 m/s plasma bullets, precision 3s laser beams, and high-yield 10s solar bursts.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-7 rounded-2xl bg-white border border-[#EEF4FA] shadow-[0_4px_16px_rgba(10,40,80,0.03)] hover:border-[#1677FF]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] flex items-center justify-center mb-5">
                  <Users size={22} />
                </div>
                <h3 className="text-base font-black text-[#061A35] uppercase tracking-wider mb-2">
                  UP TO 4 PLAYERS
                </h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Battle in competitive multiplayer modes with authoritative server synchronization at 60 Hz.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-7 rounded-2xl bg-white border border-[#EEF4FA] shadow-[0_4px_16px_rgba(10,40,80,0.03)] hover:border-[#1677FF]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#EEF4FA] text-[#1677FF] flex items-center justify-center mb-5">
                  <Sliders size={22} />
                </div>
                <h3 className="text-base font-black text-[#061A35] uppercase tracking-wider mb-2">
                  MAGNETIC AIM ASSIST
                </h3>
                <p className="text-xs text-[#53657D] leading-relaxed">
                  Smart lead indicators and forgiving 9.8m hitboxes provide satisfying hits across network latency.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ---------------- ABOUT & FOOTER SECTION ---------------- */}
        <footer id="about" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#EEF4FA] text-[#53657D] text-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}app-icon.png`} 
                alt="Emblem" 
                className="w-8 h-8 rounded-lg shadow-sm border border-[#D5E3F2] object-cover" 
              />
              <div>
                <p className="font-black text-sm text-[#061A35] tracking-wider">SPACE COLONY: FRONTIER</p>
                <p className="text-[10px] text-[#53657D] font-mono">Real-time 3D Aerospace Combat · 2026 Edition</p>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider">
              <span className="hover:text-[#1677FF] cursor-pointer" onClick={() => scrollToSection('hero')}>Top</span>
              <span className="hover:text-[#1677FF] cursor-pointer" onClick={() => scrollToSection('modes')}>Modes</span>
              <span className="hover:text-[#1677FF] cursor-pointer" onClick={() => scrollToSection('features')}>Specs</span>
              <span className="text-emerald-600 font-bold">Colyseus 0.16 Live</span>
            </div>

            <p className="text-[10px] text-[#53657D]/80">
              © 2026 Space Colony Frontier. Built with Three.js & Colyseus.
            </p>
          </div>
        </footer>

      </div>

      {/* ==========================================
          LAYER 3: FUTURISTIC WHITE MODALS
          ========================================== */}

      {/* ---------------- 1. CREATE ROOM MODAL ---------------- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061A35]/60 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#EEF4FA] overflow-hidden transform transition-all animate-scaleUp max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-[#EEF4FA] flex items-center justify-between bg-[#F7FAFF]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#061A35] tracking-wide">
                    CREATE FRONTIER ROOM
                  </h3>
                  <p className="text-[11px] text-[#53657D]">
                    Configure your squad battle and launch into space.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* Mode Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Combat Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGameMode('1v1')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      gameMode === '1v1'
                        ? 'border-[#1677FF] bg-[#1677FF]/10 text-[#1677FF] font-bold shadow-sm'
                        : 'border-[#D5E3F2] bg-[#F7FAFF] text-[#53657D] hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-black">1V1 DUEL</p>
                    <p className="text-[9px] opacity-75">2 Players</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('FFA')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      gameMode === 'FFA'
                        ? 'border-[#1677FF] bg-[#1677FF]/10 text-[#1677FF] font-bold shadow-sm'
                        : 'border-[#D5E3F2] bg-[#F7FAFF] text-[#53657D] hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-black">4-PLAYER FFA</p>
                    <p className="text-[9px] opacity-75">All vs All</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode('2v2')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      gameMode === '2v2'
                        ? 'border-[#1677FF] bg-[#1677FF]/10 text-[#1677FF] font-bold shadow-sm'
                        : 'border-[#D5E3F2] bg-[#F7FAFF] text-[#53657D] hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-black">2V2 SQUAD</p>
                    <p className="text-[9px] opacity-75">Team Battles</p>
                  </button>
                </div>
              </div>

              {/* Call Sign Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign (e.g. Viper)"
                  maxLength={15}
                  className="w-full bg-[#F7FAFF] border border-[#D5E3F2] focus:border-[#1677FF] focus:bg-white p-3 rounded-xl text-sm font-bold text-[#061A35] outline-none transition-all"
                />
              </div>

              {/* Hull Paint Scheme */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(COLORS) as BattleColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlayerColor(c)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        playerColor === c
                          ? 'border-[#1677FF] bg-[#1677FF]/10 shadow-sm'
                          : 'border-[#D5E3F2] bg-[#F7FAFF] hover:border-gray-300'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: COLORS[c].hex }} />
                      <span className="text-[10px] uppercase font-bold text-[#0A2850]">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prominent Generated Room Code Card */}
              <div className="p-4 rounded-xl bg-[#EEF4FA] border border-[#D5E3F2] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#53657D]">
                  <span className="font-bold">ROOM CODE</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateCode(generateRoomCode());
                      nexusAudio.playClick(1100);
                    }}
                    className="flex items-center gap-1 text-[#1677FF] hover:underline cursor-pointer"
                  >
                    <RotateCw size={11} />
                    <span>Regenerate</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-[#D5E3F2] rounded-xl py-2.5 px-4 text-center font-mono font-black text-2xl tracking-[0.25em] text-[#061A35]">
                    {createCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-3 rounded-xl bg-white border border-[#D5E3F2] hover:bg-gray-50 text-[#1677FF] font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Copy code to clipboard"
                  >
                    {copiedCode ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#53657D]">
                  Share this code with other pilots to connect to your match.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 pt-3 border-t border-[#EEF4FA] flex items-center justify-end gap-3 bg-[#F7FAFF]">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-[#53657D] hover:bg-gray-200 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-6 py-3 rounded-xl bg-[#1677FF] hover:bg-[#2F8CFF] active:scale-95 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_6px_20px_rgba(22,119,255,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <Users size={16} />
                <span>ENTER BATTLE</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- 2. JOIN ROOM MODAL ---------------- */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061A35]/60 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#EEF4FA] overflow-hidden transform transition-all animate-scaleUp max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-[#EEF4FA] flex items-center justify-between bg-[#F7FAFF]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                  <ArrowRight size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#061A35] tracking-wide">
                    JOIN FRONTIER
                  </h3>
                  <p className="text-[11px] text-[#53657D]">
                    Enter the room code to join your squad.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setJoinModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* Room Code Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  ROOM CODE
                </label>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER ROOM CODE"
                  maxLength={6}
                  className="w-full bg-[#F7FAFF] border-2 border-[#1677FF]/70 focus:border-[#1677FF] focus:bg-white p-3.5 rounded-xl text-center text-xl sm:text-2xl font-mono font-black tracking-[0.3em] text-[#061A35] outline-none shadow-sm transition-all uppercase placeholder:text-gray-300"
                />
              </div>

              {/* Call Sign Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign"
                  maxLength={15}
                  className="w-full bg-[#F7FAFF] border border-[#D5E3F2] focus:border-[#1677FF] focus:bg-white p-3 rounded-xl text-sm font-bold text-[#061A35] outline-none transition-all"
                />
              </div>

              {/* Hull Paint Scheme */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(COLORS) as BattleColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlayerColor(c)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        playerColor === c
                          ? 'border-[#1677FF] bg-[#1677FF]/10 shadow-sm'
                          : 'border-[#D5E3F2] bg-[#F7FAFF] hover:border-gray-300'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: COLORS[c].hex }} />
                      <span className="text-[10px] uppercase font-bold text-[#0A2850]">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation / Notice */}
              {joinCode.trim().length > 0 && joinCode.trim().length < 4 && (
                <p className="text-[11px] text-amber-600 font-mono">
                  Room codes are 4 to 6 characters in length.
                </p>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 pt-3 border-t border-[#EEF4FA] flex items-center justify-end gap-3 bg-[#F7FAFF]">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-[#53657D] hover:bg-gray-200 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4}
                className="px-6 py-3 rounded-xl bg-[#1677FF] hover:bg-[#2F8CFF] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_6px_20px_rgba(22,119,255,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight size={16} />
                <span>JOIN BATTLE</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- 3. SOLO AI TRAINING MODAL ---------------- */}
      {soloModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061A35]/60 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#EEF4FA] overflow-hidden transform transition-all animate-scaleUp max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-[#EEF4FA] flex items-center justify-between bg-[#F7FAFF]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#061A35] tracking-wide">
                    SOLO AI TRAINING
                  </h3>
                  <p className="text-[11px] text-[#53657D]">
                    Practice tactical dogfighting against computer AI (Offline).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSoloModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* Difficulty Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  AI Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'NORMAL', 'HARD'] as CombatDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setAIDifficulty(diff)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        aiDifficulty === diff
                          ? diff === 'HARD'
                            ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-sm'
                            : diff === 'NORMAL'
                            ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold shadow-sm'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                          : 'border-[#D5E3F2] bg-[#F7FAFF] text-[#53657D] hover:border-gray-300'
                      }`}
                    >
                      <p className="text-xs font-black">{diff}</p>
                      <p className="text-[9px] opacity-75">
                        {diff === 'EASY' ? 'Relaxed' : diff === 'NORMAL' ? 'Tactical' : 'Relentless'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Call Sign Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Pilot Call Sign
                </label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Call Sign"
                  maxLength={15}
                  className="w-full bg-[#F7FAFF] border border-[#D5E3F2] focus:border-emerald-500 focus:bg-white p-3 rounded-xl text-sm font-bold text-[#061A35] outline-none transition-all"
                />
              </div>

              {/* Hull Paint Scheme */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#53657D] mb-1.5">
                  Hull Paint Scheme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(COLORS) as BattleColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlayerColor(c)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        playerColor === c
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-[#D5E3F2] bg-[#F7FAFF] hover:border-gray-300'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: COLORS[c].hex }} />
                      <span className="text-[10px] uppercase font-bold text-[#0A2850]">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 pt-3 border-t border-[#EEF4FA] flex items-center justify-end gap-3 bg-[#F7FAFF]">
              <button
                type="button"
                onClick={() => setSoloModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-[#53657D] hover:bg-gray-200 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleStartSolo}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_6px_20px_rgba(16,185,129,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <Zap size={16} />
                <span>START SOLO BATTLE</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
