import React, { useEffect, useState } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { Activity, X } from 'lucide-react';

export interface ClientPerfSnapshot {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  heapMb: number | null;
}

// Lightweight mutable telemetry shared from Three.js probe without causing 60Hz React re-renders
export const perfTelemetryRef: { current: ClientPerfSnapshot } = {
  current: {
    fps: 60,
    frameTimeMs: 16.7,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    heapMb: null
  }
};

/**
 * Developer-only Performance Monitoring Dashboard (toggled via F4).
 * Hidden from normal players by default.
 */
export const PerfMonitorPanel: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [snap, setSnap] = useState<ClientPerfSnapshot>(perfTelemetryRef.current);
  const pingMs = useMultiplayerStore(state => state.pingMs);
  const projectileCount = useMultiplayerStore(state => state.projectiles.length);
  const connectionQuality = useMultiplayerStore(state => state.connectionQuality);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F4') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setSnap({ ...perfTelemetryRef.current });
    }, 250);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  const fpsColor = snap.fps >= 50 ? 'text-emerald-400' : snap.fps >= 30 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="fixed bottom-16 right-4 z-50 w-64 bg-[#05070B]/92 border border-[#8CCDEB]/40 rounded-xl p-3 font-mono text-[11px] text-[#F4F7FA] backdrop-blur-md shadow-2xl select-none">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#8CCDEB]/20">
        <div className="flex items-center gap-1.5 font-bold text-[#8CCDEB]">
          <Activity size={13} className="text-[#FFCC00]" />
          <span>DEV PERF MONITOR (F4)</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white cursor-pointer"
          title="Close (F4)"
        >
          <X size={13} />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">FPS / Frame Time:</span>
          <span className={`font-bold ${fpsColor}`}>
            {snap.fps} FPS ({snap.frameTimeMs.toFixed(1)} ms)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Draw Calls:</span>
          <span className="font-bold text-cyan-300">{snap.drawCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Triangles:</span>
          <span className="font-bold text-cyan-300">{snap.triangles.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Geometries / Textures:</span>
          <span className="font-bold text-white">{snap.geometries} / {snap.textures}</span>
        </div>
        {snap.heapMb !== null && (
          <div className="flex justify-between">
            <span className="text-gray-400">JS Heap:</span>
            <span className="font-bold text-amber-300">{snap.heapMb} MB</span>
          </div>
        )}
        <div className="pt-1 mt-1 border-t border-[#8CCDEB]/15 flex justify-between">
          <span className="text-gray-400">Network RTT:</span>
          <span className="font-bold text-emerald-300">{pingMs > 0 ? `${pingMs} ms` : 'Local'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Link / Projectiles:</span>
          <span className="font-bold text-white uppercase">{connectionQuality} · {projectileCount}</span>
        </div>
      </div>
    </div>
  );
};
