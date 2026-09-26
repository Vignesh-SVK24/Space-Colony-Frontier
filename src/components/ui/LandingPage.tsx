import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom } from '../../multiplayer/socketClient';
import { BattleColor } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { AlertCircle, Bot, Users, Sparkles, ArrowRight } from 'lucide-react';

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
  const { playerName, setPlayerName, playerColor, setPlayerColor, error, startSoloGame } = useMultiplayerStore();
  const [joinCode, setJoinCode] = React.useState('');

  const effectiveName = playerName.trim() || 'Cadet-01';

  const handleCreate = () => {
    createRoom(effectiveName, playerColor);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinRoom(joinCode.toUpperCase(), effectiveName, playerColor);
  };

  const handleSolo = () => {
    startSoloGame();
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row min-h-[100dvh] w-full bg-[#030712] font-mono text-gray-100 overflow-y-auto">
      
      {/* Left Operations Panel: Controls & Matchmaking */}
      <div className="flex-1 p-4 sm:p-8 lg:p-12 flex flex-col justify-center max-w-xl mx-auto w-full border-t lg:border-t-0 lg:border-r border-gray-800/80 z-10">
        
        {/* Title Header */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-500/30 text-sky-400 text-xs tracking-widest uppercase mb-3">
            <Sparkles size={12} className="animate-spin" />
            <span>Combat Arena v2.0</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            SPACE COLONY<br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              FRONTIER
            </span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-widest mt-1 uppercase">
            3D Space Combat & Simulation Arena
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-950/60 border border-red-500/50 p-3.5 rounded-lg text-red-300 flex items-center gap-3 text-xs sm:text-sm animate-pulse">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Pilot Configuration Form */}
        <div className="space-y-6 sm:space-y-7">
          
          {/* Pilot Call Sign */}
          <div>
            <label className="block text-[11px] sm:text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
              Pilot Call Sign
            </label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter Call Sign (e.g. Viper-1)"
              maxLength={15}
              className="w-full bg-gray-900/90 border border-gray-700/80 p-3.5 sm:p-4 rounded-lg text-base sm:text-lg focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition-colors placeholder:text-gray-600"
            />
          </div>

          {/* Ship Color Selector */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="block text-[11px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Hull Paint Scheme
              </label>
              <span className="text-[11px] text-sky-400 tracking-wider">
                {COLORS[playerColor].label}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
              {(Object.keys(COLORS) as BattleColor[]).map((color) => {
                const isSelected = playerColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPlayerColor(color)}
                    className={`relative p-2.5 sm:p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      isSelected 
                        ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                        : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                    }`}
                  >
                    <div 
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-transform ${isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-950' : 'opacity-80'}`}
                      style={{ backgroundColor: COLORS[color].hex }}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-gray-300">
                      {color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRIMARY OPTION: PLAY ALONE (SOLO PRACTICE & BOT BATTLE) */}
          <div className="pt-2">
            <button
              onClick={handleSolo}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-lg uppercase tracking-widest text-sm sm:text-base transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer"
            >
              <Bot size={22} className="shrink-0 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Play Alone (vs AI Drone)</span>
              <ArrowRight size={18} className="shrink-0 text-emerald-100 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-1.5 tracking-wider">
              Single-Player Flight & Combat Practice · Instant Launch
            </p>
          </div>

          {/* DIVIDER: OR MULTIPLAYER */}
          <div className="flex items-center gap-3 my-2 opacity-60">
            <div className="h-px bg-gray-700 flex-1"></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400">OR 1v1 MULTIPLAYER</span>
            <div className="h-px bg-gray-700 flex-1"></div>
          </div>

          {/* MULTIPLAYER ROOM CONTROLS */}
          <div className="space-y-3">
            <button 
              onClick={handleCreate}
              className="w-full bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white font-bold py-3.5 px-4 rounded-lg uppercase tracking-widest text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(2,132,199,0.2)]"
            >
              <Users size={16} />
              <span>Create Multiplayer Room</span>
            </button>

            <div className="flex gap-2.5">
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="4-CHAR CODE"
                maxLength={4}
                className="flex-1 min-w-0 bg-gray-900 border border-gray-700 p-3 sm:p-3.5 rounded-lg text-center text-base sm:text-lg font-bold tracking-widest focus:border-sky-400 focus:outline-none transition-colors uppercase placeholder:text-gray-600"
              />
              <button 
                onClick={handleJoin}
                disabled={joinCode.length !== 4}
                className="px-6 sm:px-8 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 border border-gray-700 text-white font-bold rounded-lg uppercase tracking-widest text-xs sm:text-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Right Visual Panel: Interactive 3D Spaceship Canvas */}
      <div className="flex-1 relative h-56 sm:h-72 lg:h-auto min-h-[220px] bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-950/30 via-black to-black opacity-80 pointer-events-none z-0"></div>
        
        {/* Vessel Telemetry Overlay Label */}
        <div className="absolute top-4 right-4 z-20 text-right pointer-events-none hidden sm:block">
          <p className="text-[10px] text-sky-400/80 uppercase tracking-widest">Selected Vessel</p>
          <p className="text-xs font-bold text-white uppercase tracking-wider">{COLORS[playerColor].label}</p>
        </div>

        <Canvas 
          dpr={[1, 2]}
          camera={{ position: [0, 1.8, 5.5], fov: 45 }} 
          className="w-full h-full z-10 relative cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.6} />
          <spotLight position={[5, 6, 5]} intensity={2.5} angle={0.6} penumbra={1} color={COLORS[playerColor].hex} />
          <pointLight position={[-5, -4, -5]} intensity={1.2} color="#38bdf8" />
          <React.Suspense fallback={null}>
            <RotatingShipPreview scheme={COLORS[playerColor].scheme} />
          </React.Suspense>
        </Canvas>
      </div>

    </div>
  );
};
