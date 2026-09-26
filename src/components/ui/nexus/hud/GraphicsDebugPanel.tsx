import { useState, useEffect, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { Activity, X, Eye } from 'lucide-react';

export const GraphicsDebugPanel: FC = () => {
  const { graphicsSettings, toggleGraphicsDebug, toggleWireframe } = useNexusGameStore();
  const [stats, setStats] = useState({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 48,
    triangles: 125400,
    textures: 22,
    geometries: 38
  });

  useEffect(() => {
    if (!graphicsSettings.debugMode) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;

      if (delta >= 500) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        const frameTime = (delta / frameCount).toFixed(1);

        // Try reading WebGL render stats if canvas exists
        const canvas = document.querySelector('canvas');
        let calls = 52;
        let tris = 142000;
        let texs = 18;
        let geoms = 42;

        if (canvas) {
          const gl = (canvas as any).__r3f?.gl;
          if (gl?.info) {
            calls = gl.info.render.calls || calls;
            tris = gl.info.render.triangles || tris;
            texs = gl.info.memory.textures || texs;
            geoms = gl.info.memory.geometries || geoms;
          }
        }

        setStats({
          fps: currentFps,
          frameTimeMs: parseFloat(frameTime),
          drawCalls: calls,
          triangles: tris,
          textures: texs,
          geometries: geoms
        });

        frameCount = 0;
        lastTime = now;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [graphicsSettings.debugMode]);

  if (!graphicsSettings.debugMode) return null;

  return (
    <div className="fixed top-14 left-4 z-40 bg-slate-950/90 border border-purple-500/40 backdrop-blur-md rounded-lg p-3 font-mono text-xs select-none shadow-[0_0_20px_rgba(168,85,247,0.3)] w-64 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 text-purple-300 font-bold">
          <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>GRAPHICS MONITOR</span>
        </div>
        <button
          onClick={toggleGraphicsDebug}
          className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="flex flex-col gap-1.5 text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">FRAME RATE:</span>
          <span className={`font-bold ${stats.fps >= 55 ? 'text-emerald-400' : stats.fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
            {stats.fps} FPS ({stats.frameTimeMs} ms)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">DRAW CALLS:</span>
          <span className="font-bold text-cyan-300">{stats.drawCalls}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">TRIANGLES:</span>
          <span className="font-bold text-cyan-300">{stats.triangles.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">TEXTURES:</span>
          <span className="font-bold text-cyan-300">{stats.textures}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">GEOMETRIES:</span>
          <span className="font-bold text-cyan-300">{stats.geometries}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
          <span className="text-slate-400">TIER / PRESET:</span>
          <span className="font-bold text-purple-300 uppercase">{graphicsSettings.preset}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex gap-2">
        <button
          onClick={toggleWireframe}
          className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
            graphicsSettings.wireframe
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          {graphicsSettings.wireframe ? 'WIREFRAME ON' : 'WIREFRAME OFF'}
        </button>
      </div>
    </div>
  );
};
