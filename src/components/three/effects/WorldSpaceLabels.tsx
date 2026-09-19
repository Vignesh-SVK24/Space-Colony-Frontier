import { type FC } from 'react';
import { Html } from '@react-three/drei';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const WorldSpaceLabels: FC = () => {
  const { hudVisible } = useNexusGameStore();

  if (!hudVisible) return null;

  return (
    <group>
      {/* 1. Colony Outpost Alpha */}
      <Html position={[0, 5, 0]} center distanceFactor={140}>
        <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-[#080d1a]/80 backdrop-blur-md border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300 shadow-lg whitespace-nowrap">
          [ COLONY OUTPOST ALPHA ]
        </div>
      </Html>

      {/* 2. Apex Orbital Station */}
      <Html position={[80, 62, -40]} center distanceFactor={220}>
        <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-[#080d1a]/80 backdrop-blur-md border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-200 shadow-lg whitespace-nowrap">
          [ APEX ORBITAL STATION · 104 KM ]
        </div>
      </Html>

      {/* 3. Mining Depot Beta */}
      <Html position={[-90, 45, 75]} center distanceFactor={220}>
        <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-[#080d1a]/80 backdrop-blur-md border border-amber-400/40 text-[9px] font-mono font-bold text-amber-300 shadow-lg whitespace-nowrap">
          [ MINING DEPOT BETA · 125 KM ]
        </div>
      </Html>

      {/* 4. Asteroid Belt Alpha */}
      <Html position={[110, 15, 0]} center distanceFactor={260}>
        <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-[#080d1a]/80 backdrop-blur-md border border-slate-500/40 text-[9px] font-mono font-bold text-slate-300 shadow-lg whitespace-nowrap">
          [ ASTEROID BELT ALPHA (IRON) ]
        </div>
      </Html>

      {/* 5. Moon Selene-Prime */}
      <Html position={[130, 20, 130]} center distanceFactor={350}>
        <div className="pointer-events-none select-none px-2 py-0.5 rounded bg-[#080d1a]/80 backdrop-blur-md border border-slate-400/50 text-[10px] font-mono font-bold text-slate-100 shadow-lg whitespace-nowrap">
          [ MOON SELENE-PRIME ]
        </div>
      </Html>
    </group>
  );
};
