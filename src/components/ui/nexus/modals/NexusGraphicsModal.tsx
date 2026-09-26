import { useState, useMemo, type FC } from 'react';
import { useNexusGameStore } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { QualityPreset, GraphicsSettings } from '../../../../config/graphicsConfig';
import { Monitor, Sun, Sparkles, Eye, Wind, Layers, Cpu, Bug, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const NexusGraphicsModal: FC = () => {
  const {
    activeModal,
    closeModal,
    graphicsSettings,
    setGraphicsQuality,
    updateGraphicsSettings,
    toggleGraphicsDebug,
    toggleWireframe
  } = useNexusGameStore();

  const [appliedNotice, setAppliedNotice] = useState(false);

  // Detect GPU / Renderer
  const gpuInfo = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Standard WebGL2 GPU';
        return renderer;
      }
    } catch {
      // ignore
    }
    return 'WebGL2 Hardware Accelerated';
  }, []);

  const presets: { id: QualityPreset; label: string; desc: string }[] = [
    { id: 'low', label: 'LOW', desc: 'Maximum framerate. Basic lighting, shadows disabled.' },
    { id: 'medium', label: 'MEDIUM', desc: 'Balanced visual fidelity with soft shadows and bloom.' },
    { id: 'high', label: 'HIGH', desc: 'Recommended. Full PBR reflections, post-processing, and rich biomes.' },
    { id: 'ultra', label: 'ULTRA', desc: 'Cinematic master tier. 4K shadow maps, max flora density, full depth.' }
  ];

  const handlePresetSelect = (p: QualityPreset) => {
    nexusAudio.playConfirm();
    setGraphicsQuality(p);
    triggerNotice();
  };

  const triggerNotice = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const isOpen = activeModal === 'graphics' || activeModal === 'settings';

  return (
    <NexusModal
      isOpen={isOpen}
      onClose={closeModal}
      title="NEXUS GRAPHICS & RENDERING PIPELINE"
      subtitle="PBR SHADING, POST-PROCESSING & HARDWARE CALIBRATION"
      badge={graphicsSettings.preset.toUpperCase()}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4 font-mono select-none">
        {/* GPU Hardware Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-cyan-500/25 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">DETECTED ACCELERATOR:</span>
            <span className="text-cyan-300 font-bold truncate max-w-[280px] sm:max-w-md">{gpuInfo}</span>
          </div>
          {appliedNotice && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
              <Check className="w-3 h-3" /> SETTINGS APPLIED
            </span>
          )}
        </div>

        {/* Master Quality Presets */}
        <div>
          <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 block">
            MASTER QUALITY PRESET
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((p) => {
              const isSelected = graphicsSettings.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={clsx(
                    'flex flex-col p-2.5 rounded-lg border text-left transition cursor-pointer',
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:border-cyan-500/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">{p.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Granular Setting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-lg border border-cyan-500/20 text-xs">
          {/* Shadows */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Shadow Quality</span>
            </div>
            <select
              value={graphicsSettings.shadowQuality}
              onChange={(e) => {
                nexusAudio.playClick();
                const sq = e.target.value as GraphicsSettings['shadowQuality'];
                updateGraphicsSettings({ shadowQuality: sq, shadows: sq !== 'off' });
                triggerNotice();
              }}
              className="bg-slate-950 border border-cyan-500/30 rounded px-2 py-1 text-cyan-300 font-bold text-xs focus:outline-none"
            >
              <option value="off">OFF</option>
              <option value="low">LOW (1K)</option>
              <option value="high">HIGH (2K)</option>
              <option value="ultra">ULTRA (4K)</option>
            </select>
          </div>

          {/* Post Processing */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Post-Processing</span>
            </div>
            <select
              value={graphicsSettings.postProcessing}
              onChange={(e) => {
                nexusAudio.playClick();
                updateGraphicsSettings({ postProcessing: e.target.value as GraphicsSettings['postProcessing'] });
                triggerNotice();
              }}
              className="bg-slate-950 border border-cyan-500/30 rounded px-2 py-1 text-cyan-300 font-bold text-xs focus:outline-none"
            >
              <option value="off">OFF</option>
              <option value="low">LOW</option>
              <option value="high">HIGH (BLOOM + VIG)</option>
            </select>
          </div>

          {/* Vegetation Density */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Wind className="w-4 h-4 text-emerald-400" />
              <span>Flora & Terrain Props</span>
            </div>
            <select
              value={graphicsSettings.vegetationDensity}
              onChange={(e) => {
                nexusAudio.playClick();
                updateGraphicsSettings({ vegetationDensity: e.target.value as GraphicsSettings['vegetationDensity'] });
                triggerNotice();
              }}
              className="bg-slate-950 border border-cyan-500/30 rounded px-2 py-1 text-cyan-300 font-bold text-xs focus:outline-none"
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH (4 SPECIES)</option>
            </select>
          </div>

          {/* View Distance */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>View Distance</span>
            </div>
            <select
              value={graphicsSettings.viewDistance}
              onChange={(e) => {
                nexusAudio.playClick();
                updateGraphicsSettings({ viewDistance: e.target.value as GraphicsSettings['viewDistance'] });
                triggerNotice();
              }}
              className="bg-slate-950 border border-cyan-500/30 rounded px-2 py-1 text-cyan-300 font-bold text-xs focus:outline-none"
            >
              <option value="low">800 M</option>
              <option value="medium">1.4 KM</option>
              <option value="high">2.2 KM</option>
              <option value="ultra">3.5 KM</option>
            </select>
          </div>

          {/* Reflections */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Specular PBR Reflections</span>
            </div>
            <button
              onClick={() => {
                nexusAudio.playClick();
                updateGraphicsSettings({ reflections: graphicsSettings.reflections === 'high' ? 'low' : 'high' });
                triggerNotice();
              }}
              className="px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 font-bold text-xs"
            >
              {graphicsSettings.reflections.toUpperCase()}
            </button>
          </div>

          {/* Anti-Aliasing */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Monitor className="w-4 h-4 text-blue-400" />
              <span>Hardware Anti-Aliasing</span>
            </div>
            <button
              onClick={() => {
                nexusAudio.playClick();
                updateGraphicsSettings({ antiAliasing: !graphicsSettings.antiAliasing });
                triggerNotice();
              }}
              className={clsx(
                'px-2.5 py-1 rounded border text-xs font-bold transition',
                graphicsSettings.antiAliasing
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-950 border-slate-700 text-slate-400'
              )}
            >
              {graphicsSettings.antiAliasing ? 'ON (MSAA)' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Developer Diagnostics & Wireframe */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-purple-500/25 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 font-bold">DEVELOPER TOOLS:</span>
            <span className="text-slate-400">Live GPU & Scene Diagnostics</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                nexusAudio.playClick();
                toggleWireframe();
              }}
              className={clsx(
                'px-2 py-1 rounded border text-[11px] font-bold transition cursor-pointer',
                graphicsSettings.wireframe
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              )}
            >
              WIREFRAME: {graphicsSettings.wireframe ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                nexusAudio.playClick();
                toggleGraphicsDebug();
              }}
              className={clsx(
                'px-2 py-1 rounded border text-[11px] font-bold transition cursor-pointer',
                graphicsSettings.debugMode
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              )}
            >
              DEBUG HUD: {graphicsSettings.debugMode ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-cyan-500/20">
          <NexusButton variant="primary" onClick={closeModal}>
            CONFIRM & CLOSE
          </NexusButton>
        </div>
      </div>
    </NexusModal>
  );
};
