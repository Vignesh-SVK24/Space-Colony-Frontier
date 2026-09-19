import { useState, type FC } from 'react';
import { SceneRoot } from './components/three/scene/SceneRoot';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GAME_CONFIG, BUILDING_DEFS, RESOURCE_DEFS } from './config';
import { getAsset, logMissingAsset } from './assets/AssetLoader';
import { Activity, Shield, Terminal, Radio, Cpu, Layers } from 'lucide-react';

export const App: FC = () => {
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const testValidAsset = () => {
    const res = getAsset('ship_player');
    setLogOutput((prev) => [
      `[${new Date().toLocaleTimeString()}] getAsset('ship_player') -> ${res.kind} (${res.status})`,
      ...prev.slice(0, 5)
    ]);
  };

  const testMissingAssetFallback = () => {
    logMissingAsset('unknown_alien_dreadnought', 'assets/models/aliens/dreadnought.glb');
    const res = getAsset('unknown_alien_dreadnought');
    setLogOutput((prev) => [
      `[${new Date().toLocaleTimeString()}] FALLBACK TEST: getAsset('unknown_alien_dreadnought') -> ${res.kind} (${res.status})`,
      ...prev.slice(0, 5)
    ]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-mono select-none">
      {/* 3D Scene Viewport */}
      <ErrorBoundary fallbackTitle="3D Scene Initialization Failure">
        <SceneRoot />
      </ErrorBoundary>

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 p-4 pointer-events-none flex justify-between items-start z-10">
        <div className="hud-panel px-4 py-2 rounded pointer-events-auto border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-lg font-bold text-cyan-300 tracking-wider hud-glow">
              {GAME_CONFIG.title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
              v{GAME_CONFIG.version} - PHASE 0 FOUNDATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engine: React 19 + R3F + Three.js r186 + Strict TypeScript
          </p>
        </div>

        <div className="hud-panel px-4 py-2 rounded pointer-events-auto flex items-center gap-4 text-xs border border-cyan-500/30">
          <div className="flex items-center gap-1 text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>CORE: ONLINE</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Cpu className="w-4 h-4" />
            <span>TICK: {GAME_CONFIG.ticksPerSecond} Hz</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Activity className="w-4 h-4" />
            <span>STATUS: READY</span>
          </div>
        </div>
      </header>

      {/* Left Telemetry / Diagnostics Overlay */}
      <aside className="absolute left-4 top-24 w-80 pointer-events-none z-10 flex flex-col gap-3">
        <div className="hud-panel p-4 rounded pointer-events-auto border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>DIAGNOSTICS & FALLBACKS</span>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              VERIFIED
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Verify zero-failure asset architecture. Test procedural fallbacks with zero external models.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={testValidAsset}
              className="w-full text-left text-xs px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 rounded border border-cyan-500/20 hover:border-cyan-400 transition"
            >
              Test getAsset('ship_player')
            </button>
            <button
              onClick={testMissingAssetFallback}
              className="w-full text-left text-xs px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-amber-300 rounded border border-amber-500/20 hover:border-amber-400 transition"
            >
              Test Missing Asset (Fallback Check)
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full text-left text-xs px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-indigo-300 rounded border border-indigo-500/20 hover:border-indigo-400 transition flex items-center justify-between"
            >
              <span>Inspect Config Definitions</span>
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-time Diagnostics Log */}
          {logOutput.length > 0 && (
            <div className="mt-3 p-2 bg-slate-950/90 rounded border border-cyan-900/40 text-[11px] font-mono text-cyan-300 max-h-32 overflow-y-auto flex flex-col gap-1">
              {logOutput.map((log, i) => (
                <div key={i} className="truncate">{log}</div>
              ))}
            </div>
          )}
        </div>

        {showConfig && (
          <div className="hud-panel p-4 rounded pointer-events-auto border border-cyan-500/30 text-xs text-slate-300 max-h-64 overflow-y-auto">
            <h4 className="text-cyan-400 font-bold mb-2">Central Config Inventory</h4>
            <ul className="space-y-1">
              <li>? Building Types Registered: <span className="text-emerald-400">{Object.keys(BUILDING_DEFS).length}</span></li>
              <li>? Resources Configured: <span className="text-emerald-400">{Object.keys(RESOURCE_DEFS).length}</span></li>
              <li>? Fixed Sim Rate: <span className="text-emerald-400">{GAME_CONFIG.ticksPerSecond} TPS</span></li>
              <li>? Game Day: <span className="text-emerald-400">{GAME_CONFIG.gameHoursPerDay}h ({GAME_CONFIG.realSecondsPerGameDay}s real)</span></li>
            </ul>
          </div>
        )}
      </aside>

      {/* Bottom Hint Bar */}
      <footer className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-between items-center text-xs text-slate-400 z-10">
        <div className="hud-panel px-3 py-1.5 rounded pointer-events-auto border border-cyan-500/20 text-cyan-300">
          Controls: Left-click + Drag to Orbit ? Scroll to Zoom ? Right-click to Pan
        </div>
        <div className="hud-panel px-3 py-1.5 rounded pointer-events-auto border border-emerald-500/30 text-emerald-400">
          Phase 0: Architecture Ready ? Phase 1: Environment Next
        </div>
      </footer>
    </div>
  );
};

export default App;
