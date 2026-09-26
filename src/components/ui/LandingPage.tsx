import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { createRoom, joinRoom } from '../../multiplayer/socketClient';
import { BattleColor } from '../../multiplayer/types';
import { SpaceshipModel } from '../three/spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../config/visualTheme';
import { AlertCircle } from 'lucide-react';

const COLORS: Record<BattleColor, { hex: string; scheme: SpaceshipPaintSchemeKey }> = {
  yellow: { hex: '#eab308', scheme: 'battle_yellow' },
  blue: { hex: '#3b82f6', scheme: 'battle_blue' },
  red: { hex: '#ef4444', scheme: 'battle_red' },
  green: { hex: '#22c55e', scheme: 'battle_green' }
};

const RotatingShipPreview: React.FC<{ scheme: SpaceshipPaintSchemeKey }> = ({ scheme }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} rotation={[0.2, 0, 0]}>
      <SpaceshipModel paintScheme={scheme} throttle={0.3} />
    </group>
  );
};

export const LandingPage: React.FC = () => {
  const { playerName, setPlayerName, playerColor, setPlayerColor, error } = useMultiplayerStore();
  const [joinCode, setJoinCode] = React.useState('');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    createRoom(playerName, playerColor);
  };

  const handleJoin = () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    joinRoom(joinCode.toUpperCase(), playerName, playerColor);
  };

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full bg-gray-950 font-mono text-gray-100">
      
      {/* Left Panel */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center max-w-2xl mx-auto w-full border-t md:border-t-0 md:border-r border-gray-800">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 tracking-tighter text-sky-400">
          SPACE COLONY:<br/>FRONTIER
        </h1>
        <p className="text-gray-400 mb-12 tracking-widest text-sm">MULTIPLAYER SPACE BATTLE</p>

        {error && (
          <div className="mb-6 bg-red-950/50 border border-red-500/50 p-4 rounded text-red-400 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-widest">Pilot Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter Call Sign"
              maxLength={12}
              className="w-full bg-gray-900 border border-gray-700 p-4 rounded text-lg focus:border-sky-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-3 uppercase tracking-widest">Ship Color</label>
            <div className="flex gap-4">
              {(Object.keys(COLORS) as BattleColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setPlayerColor(color)}
                  className={`w-12 h-12 rounded-full transition-all duration-200 ${playerColor === color ? 'ring-4 ring-offset-4 ring-offset-gray-950 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                  style={{ backgroundColor: COLORS[color].hex }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={!playerName.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 text-white font-bold py-4 rounded uppercase tracking-widest transition-colors cursor-pointer"
          >
            Create Room
          </button>

          <div className="flex items-center gap-4 my-6 opacity-50">
            <div className="h-px bg-gray-600 flex-1"></div>
            <span className="text-xs uppercase tracking-widest">OR</span>
            <div className="h-px bg-gray-600 flex-1"></div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={4}
              className="flex-1 bg-gray-900 border border-gray-700 p-4 rounded text-center text-lg font-bold tracking-widest focus:border-sky-400 focus:outline-none transition-colors"
            />
            <button 
              onClick={handleJoin}
              disabled={!playerName.trim() || joinCode.length !== 4}
              className="px-8 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-white font-bold rounded uppercase tracking-widest transition-colors cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 relative h-64 md:h-auto bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-60 pointer-events-none z-0"></div>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }} className="w-full h-full z-10 relative">
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 5, 5]} intensity={2} angle={0.5} penumbra={1} color={COLORS[playerColor].hex} />
          <pointLight position={[-5, -5, -5]} intensity={1} />
          <React.Suspense fallback={null}>
            <RotatingShipPreview scheme={COLORS[playerColor].scheme} />
          </React.Suspense>
        </Canvas>
      </div>

    </div>
  );
};
