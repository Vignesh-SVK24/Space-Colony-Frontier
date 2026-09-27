import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { ARENA_OBSTACLES, checkObstacleRaycast } from '../../../../config/arenaObstacles';
import { COMBAT_CONFIG } from '../../../../config/combatConfig';
import { X, ZoomIn, ZoomOut, Compass, Crosshair, Layers } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const FullScreenTacticalMap: React.FC = () => {
  const isMapOpen = useMultiplayerStore(state => state.isMapOpen);
  const setMapOpen = useMultiplayerStore(state => state.setMapOpen);
  const selfState = useMultiplayerStore(state => state.selfState);
  const opponentState = useMultiplayerStore(state => state.opponentState);

  // Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1.1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer Visibility Toggles
  const [showPlayers, setShowPlayers] = useState(true);
  const [showObstacles, setShowObstacles] = useState(true);
  const [showCoverZones, setShowCoverZones] = useState(true);
  const [showRangeRings, setShowRangeRings] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Close with ESC or M
  useEffect(() => {
    if (!isMapOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyM') {
        e.preventDefault();
        setMapOpen(false);
        nexusAudio.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapOpen, setMapOpen]);

  // Center coordinate conversions (Top-down: X is horizontal, Z is vertical)
  const mapWidth = 900;
  const mapHeight = 900;
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  // Arena radius is 300m, map boundary circle will have radius ~380px at 1.0 zoom
  const scaleFactor = 1.25 * zoom;

  const worldToScreen = useCallback((x: number, z: number) => {
    return {
      x: centerX + (x * scaleFactor) + pan.x,
      y: centerY + (z * scaleFactor) + pan.y
    };
  }, [centerX, centerY, scaleFactor, pan]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.min(2.8, Math.max(0.45, prev * factor)));
  };

  // Center on Player
  const centerOnPlayer = () => {
    if (!selfState) return;
    setPan({
      x: -(selfState.position[0] * scaleFactor),
      y: -(selfState.position[2] * scaleFactor)
    });
    nexusAudio.playClick();
  };

  // Center on Opponent
  const centerOnOpponent = () => {
    if (!opponentState) return;
    setPan({
      x: -(opponentState.position[0] * scaleFactor),
      y: -(opponentState.position[2] * scaleFactor)
    });
    nexusAudio.playClick();
  };

  // Reset to Fit Arena
  const fitArena = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1.05);
    nexusAudio.playClick();
  };

  // Line of sight raycast between player and opponent
  const losResult = useMemo(() => {
    if (!selfState || !opponentState) return null;
    return checkObstacleRaycast(
      selfState.position[0], selfState.position[1], selfState.position[2],
      opponentState.position[0], opponentState.position[1], opponentState.position[2]
    );
  }, [selfState, opponentState]);

  if (!isMapOpen) return null;

  const playerScreen = selfState ? worldToScreen(selfState.position[0], selfState.position[2]) : null;
  const oppScreen = opponentState ? worldToScreen(opponentState.position[0], opponentState.position[2]) : null;

  // Heading angle calculation
  const playerYaw = selfState ? selfState.rotation[1] : 0;
  const oppYaw = opponentState ? opponentState.rotation[1] : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl font-mono text-cyan-400 select-none">
      
      {/* Top Console Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cyan-500/30 bg-black/60 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="text-xs sm:text-sm font-bold tracking-widest text-cyan-300">
              TACTICAL BATTLEFIELD RADAR // REAL-TIME TOP-DOWN CONSOLE
            </div>
            <div className="text-[10px] text-cyan-600 hidden sm:block">
              ARENA RADIUS: {COMBAT_CONFIG.ARENA_RADIUS}M | FORCEFIELD: ONLINE | VECTOR RESOLUTION: AUTHORITATIVE
            </div>
          </div>
        </div>

        {/* Zoom & Close Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/50 border border-cyan-800 rounded px-1 py-0.5 text-xs">
            <button
              onClick={() => setZoom(z => Math.max(0.45, z * 0.85))}
              className="p-1 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-2 text-[11px] text-gray-400 font-bold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2.8, z * 1.15))}
              className="p-1 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setMapOpen(false);
              nexusAudio.playClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <X size={15} />
            <span>CLOSE (ESC)</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Map Canvas Viewport */}
      <div 
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg 
          className="w-full h-full"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
            </pattern>
            {/* Glow Filter */}
            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid */}
          {showGrid && (
            <rect width="100%" height="100%" fill="url(#tacticalGrid)" />
          )}

          {/* 1. Range Rings */}
          {showRangeRings && (
            <g transform={`translate(${centerX + pan.x}, ${centerY + pan.y})`}>
              {[50, 100, 150, 200, 250, 300].map(r => {
                const screenR = r * scaleFactor;
                const isBoundary = r === COMBAT_CONFIG.ARENA_RADIUS;
                return (
                  <g key={r}>
                    <circle
                      cx="0"
                      cy="0"
                      r={screenR}
                      fill="none"
                      stroke={isBoundary ? '#06b6d4' : 'rgba(6, 182, 212, 0.18)'}
                      strokeWidth={isBoundary ? '2.5' : '1'}
                      strokeDasharray={isBoundary ? '6,6' : '3,3'}
                    />
                    <text
                      x={screenR + 4}
                      y="-4"
                      fill={isBoundary ? '#06b6d4' : 'rgba(6, 182, 212, 0.5)'}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {r}M {isBoundary && '(BOUNDARY)'}
                    </text>
                  </g>
                );
              })}

              {/* Crosshair Cardinal Axes */}
              <line x1="-400" y1="0" x2="400" y2="0" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="1" />
              <line x1="0" y1="-400" x2="0" y2="400" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="1" />
            </g>
          )}

          {/* 2. Obstacles & Tactical Cover */}
          {showObstacles && ARENA_OBSTACLES.map(obs => {
            const pos = worldToScreen(obs.position[0], obs.position[2]);
            const obsRadius = obs.radius * scaleFactor;
            const isStation = obs.type === 'station';
            const isWreck = obs.type === 'wreck';
            const isDebris = obs.type === 'debris';

            const fillColor = isStation
              ? 'rgba(56, 189, 248, 0.15)'
              : isWreck
              ? 'rgba(249, 115, 22, 0.15)'
              : isDebris
              ? 'rgba(234, 179, 8, 0.15)'
              : 'rgba(100, 116, 139, 0.2)';

            const strokeColor = isStation
              ? '#38bdf8'
              : isWreck
              ? '#f97316'
              : isDebris
              ? '#eab308'
              : '#94a3b8';

            return (
              <g key={obs.id} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Physical Collider Zone */}
                <circle
                  cx="0"
                  cy="0"
                  r={obsRadius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                />

                {/* Inner Pattern for Wreck / Station */}
                {isStation && (
                  <rect
                    x={-obsRadius * 0.5}
                    y={-obsRadius * 0.5}
                    width={obsRadius}
                    height={obsRadius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Cover Indicator Dot */}
                {showCoverZones && obs.isCover && (
                  <circle
                    cx="0"
                    cy="0"
                    r="3.5"
                    fill="#f59e0b"
                  />
                )}

                {/* Tactical Label & Altitude */}
                <text
                  x="0"
                  y={obsRadius + 13}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="9"
                  fontWeight="bold"
                  className="tracking-wider"
                >
                  {obs.tacticalLabel}
                </text>
                <text
                  x="0"
                  y={obsRadius + 22}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.7)"
                  fontSize="7.5"
                >
                  ALT: {Math.round(obs.position[1])}M | R: {obs.radius}M
                </text>
              </g>
            );
          })}

          {/* 3. Line-of-Sight Ray (Player to Opponent) */}
          {showPlayers && playerScreen && oppScreen && (
            <g>
              <line
                x1={playerScreen.x}
                y1={playerScreen.y}
                x2={oppScreen.x}
                y2={oppScreen.y}
                stroke={losResult?.blocked ? '#64748b' : '#ef4444'}
                strokeWidth={losResult?.blocked ? '1' : '1.5'}
                strokeDasharray="4,4"
                opacity={losResult?.blocked ? 0.4 : 0.8}
              />
              {losResult?.blocked && losResult.hitPoint && (
                <g>
                  {(() => {
                    const blockPt = worldToScreen(losResult.hitPoint[0], losResult.hitPoint[2]);
                    return (
                      <g transform={`translate(${blockPt.x}, ${blockPt.y})`}>
                        <circle cx="0" cy="0" r="5" fill="#ef4444" opacity="0.8" />
                        <text x="8" y="3" fill="#ef4444" fontSize="8" fontWeight="bold">
                          LOS BLOCKED ({losResult.obstacle?.tacticalLabel})
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </g>
          )}

          {/* 4. Opponent Marker (Red) */}
          {showPlayers && opponentState && oppScreen && (
            <g transform={`translate(${oppScreen.x}, ${oppScreen.y})`}>
              {/* Threat Aura */}
              <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.18)" filter="url(#redGlow)" />
              {/* Heading Pointer Chevron */}
              <path
                d="M 0 -10 L 7 8 L 0 5 L -7 8 Z"
                fill="#ef4444"
                transform={`rotate(${(-oppYaw * 180) / Math.PI})`}
              />
              {/* Opponent Info Plate */}
              <text x="14" y="-3" fill="#ef4444" fontSize="10" fontWeight="bold">
                {opponentState.name}
              </text>
              <text x="14" y="8" fill="#fda4af" fontSize="8">
                HP: {Math.max(0, Math.floor(opponentState.hp))}% | ALT: {Math.round(opponentState.position[1])}M
              </text>
            </g>
          )}

          {/* 5. Player Marker (Cyan) */}
          {showPlayers && selfState && playerScreen && (
            <g transform={`translate(${playerScreen.x}, ${playerScreen.y})`}>
              {/* Sensor Pulse */}
              <circle cx="0" cy="0" r="18" fill="rgba(6, 182, 212, 0.2)" filter="url(#cyanGlow)" />
              {/* Ship Chevron Icon */}
              <path
                d="M 0 -12 L 8 10 L 0 6 L -8 10 Z"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="1"
                transform={`rotate(${(-playerYaw * 180) / Math.PI})`}
              />
              {/* Callsign & Altitude */}
              <text x="14" y="-3" fill="#38bdf8" fontSize="10" fontWeight="bold">
                YOU ({selfState.name})
              </text>
              <text x="14" y="8" fill="#bae6fd" fontSize="8">
                HP: {Math.floor(selfState.hp)}% | ALT: {Math.round(selfState.position[1])}M
              </text>
            </g>
          )}
        </svg>

        {/* Compass / Orientation Rose in Top Left */}
        <div className="absolute top-4 left-4 p-2 bg-black/70 border border-cyan-800 rounded flex items-center gap-2 text-xs">
          <Compass size={18} className="text-cyan-400" />
          <div className="flex flex-col text-[10px]">
            <span className="font-bold text-cyan-300">GRID: TOP-DOWN (XZ)</span>
            <span className="text-gray-400">Y-AXIS: VERTICAL ELEVATION</span>
          </div>
        </div>

        {/* Legend / Key in Top Right */}
        <div className="absolute top-4 right-4 hidden md:flex flex-col gap-1.5 p-2.5 bg-black/75 border border-cyan-800/60 rounded text-[11px] backdrop-blur-md">
          <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-0.5">Tactical Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-gray-200">Player Ship (You)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-200">Hostile / Opponent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-gray-200">Tactical Cover Point</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border border-slate-400 bg-slate-700" />
            <span className="text-gray-200">Physical Obstacle</span>
          </div>
        </div>
      </div>

      {/* Bottom Command Toolbar */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-t border-cyan-500/30 bg-black/80">
        
        {/* Navigation Quick Focus Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={centerOnPlayer}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Crosshair size={13} />
            <span>MY SHIP</span>
          </button>

          <button
            onClick={centerOnOpponent}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-600/50 text-red-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Crosshair size={13} />
            <span>OPPONENT</span>
          </button>

          <button
            onClick={fitArena}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>FIT ARENA</span>
          </button>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1">
            <Layers size={13} />
            <span>LAYERS:</span>
          </span>

          <button
            onClick={() => setShowPlayers(!showPlayers)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
              showPlayers ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-black text-gray-500 border-gray-800'
            }`}
          >
            SHIPS
          </button>

          <button
            onClick={() => setShowObstacles(!showObstacles)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
              showObstacles ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-black text-gray-500 border-gray-800'
            }`}
          >
            OBSTACLES
          </button>

          <button
            onClick={() => setShowCoverZones(!showCoverZones)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
              showCoverZones ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-black text-gray-500 border-gray-800'
            }`}
          >
            COVER
          </button>

          <button
            onClick={() => setShowRangeRings(!showRangeRings)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
              showRangeRings ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-black text-gray-500 border-gray-800'
            }`}
          >
            RINGS
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
              showGrid ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-black text-gray-500 border-gray-800'
            }`}
          >
            GRID
          </button>
        </div>

      </footer>

    </div>
  );
};
