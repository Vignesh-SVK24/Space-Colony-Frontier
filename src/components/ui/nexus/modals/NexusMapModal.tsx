import { useState, useMemo, useRef, useEffect, type FC } from 'react';
import { useNexusGameStore, MapScaleLevel } from '../../../../state/useNexusGameStore';
import { NexusModal } from '../NexusModal';
import { NexusButton } from '../NexusButton';
import { Compass, Globe, CircleDot, Sparkles, Navigation, Filter, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export interface WorldMapEntity {
  id: string;
  name: string;
  category: 'player' | 'colony' | 'station' | 'satellite' | 'asteroid' | 'ufo' | 'planet' | 'star' | 'moon' | 'resource' | 'mission';
  position: [number, number, number];
  scale: MapScaleLevel[];
  color: string;
  icon?: string;
  description: string;
}

export const NexusMapModal: FC = () => {
  const {
    activeModal,
    closeModal,
    mapScale,
    setMapScale,
    shipPosition,
    astronautPosition,
    gameMode,
    planetaryPOIs,
    activeWaypoint,
    setWaypoint,
    clearWaypoint
  } = useNexusGameStore();

  const [selectedEntity, setSelectedEntity] = useState<WorldMapEntity | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [followPlayer, setFollowPlayer] = useState(false);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const isAstronaut = gameMode === 'ASTRONAUT';
  const playerPos = isAstronaut ? astronautPosition : shipPosition;

  // Auto-switch map to surface mode when in astronaut exploration
  useEffect(() => {
    if (isAstronaut && mapScale !== 'surface') {
      setMapScale('surface');
    }
  }, [isAstronaut, mapScale, setMapScale]);

  // Registry of real 3D objects with authentic world-space coordinates
  const allEntities = useMemo<WorldMapEntity[]>(() => {
    const list: WorldMapEntity[] = [
      // Live Player
      {
        id: 'player-entity',
        name: isAstronaut ? 'COMMANDER (EVA SUIT)' : 'FRONTIER RECON SHIP',
        category: 'player',
        position: playerPos,
        scale: ['surface', 'orbit', 'system', 'deep_space'],
        color: 'bg-cyan-400 shadow-[0_0_12px_#38bdf8]',
        description: isAstronaut
          ? 'Active human exploration unit. MK-IV EVA suit life support nominal.'
          : 'Player spacecraft. 6-DOF avionics and pulse-drive propulsion active.'
      },

      // Colony & Surface POIs
      {
        id: 'colony-hub',
        name: 'OUTPOST ALPHA (MAIN HUB)',
        category: 'colony',
        position: [0, -1.4, 0],
        scale: ['surface', 'orbit', 'system'],
        color: 'bg-cyan-300',
        description: 'Primary colony landing deck, quantum core beacon, and atmospheric perimeter.'
      },
      ...planetaryPOIs.map((poi) => ({
        id: poi.id,
        name: poi.name,
        category: poi.type === 'mineral' ? ('resource' as const) : poi.type === 'monolith' ? ('ufo' as const) : ('colony' as const),
        position: poi.position,
        scale: ['surface' as const],
        color: poi.type === 'mineral' ? 'bg-sky-400' : poi.type === 'monolith' ? 'bg-purple-400' : 'bg-emerald-400',
        description: poi.description
      })),

      // Orbital Layer
      {
        id: 'apex-station',
        name: 'APEX ORBITAL RESEARCH HUB',
        category: 'station',
        position: [25, 20, -35],
        scale: ['orbit', 'system', 'deep_space'],
        color: 'bg-cyan-400',
        description: 'High-altitude space station with rotating gravity centrifuge and laboratory ring.'
      },
      {
        id: 'mining-depot',
        name: 'MINING DEPOT BETA',
        category: 'station',
        position: [-45, 15, 30],
        scale: ['orbit', 'system', 'deep_space'],
        color: 'bg-amber-400',
        description: 'Automated mineral refining terminal receiving continuous cargo shuttle transports.'
      },
      {
        id: 'sat-constellation',
        name: 'NAV-SAT COMM NETWORK',
        category: 'satellite',
        position: [0, 48, 0],
        scale: ['orbit', 'system'],
        color: 'bg-emerald-400',
        description: '6-satellite synchronized orbital constellation offering 99.2% planetary comms.'
      },
      {
        id: 'belt-alpha',
        name: 'ASTEROID BELT ALPHA',
        category: 'asteroid',
        position: [0, 5, 0],
        scale: ['orbit', 'system'],
        color: 'bg-slate-400',
        description: 'Dense planetary mineral ring comprising ferrous basalt and titanium silicates.'
      },
      {
        id: 'ufo-patrol',
        name: 'ANOMALOUS UFO WARP PATROL',
        category: 'ufo',
        position: [35, 18, -40],
        scale: ['orbit', 'system'],
        color: 'bg-purple-400',
        description: 'Extraterrestrial quantum scout vessel detected by long-range radar arrays.'
      },

      // System Layer
      {
        id: 'planet-aethelia',
        name: 'AETHELIA-IV (PRIMARY WORLD)',
        category: 'planet',
        position: [0, -180, 0],
        scale: ['system', 'deep_space'],
        color: 'bg-cyan-500',
        description: 'Habitable frontier world rich in biomes, atmosphere, and geothermal valleys.'
      },
      {
        id: 'moon-selene',
        name: 'MOON SELENE-PRIME',
        category: 'moon',
        position: [75, 45, 65],
        scale: ['system', 'deep_space'],
        color: 'bg-slate-200',
        description: 'Major natural satellite with high-albedo regolith and deep impact craters.'
      },
      {
        id: 'sun-helios',
        name: 'PRIMARY STAR HELIOS',
        category: 'star',
        position: [180, 120, -220],
        scale: ['system', 'deep_space'],
        color: 'bg-amber-300 shadow-[0_0_20px_#f59e0b]',
        description: 'Class-G luminous yellow star powering the colonial system solar grid.'
      },

      // Deep Space Layer
      {
        id: 'planet-gorgon',
        name: 'GAS GIANT GORGON',
        category: 'planet',
        position: [-240, 60, -200],
        scale: ['deep_space'],
        color: 'bg-orange-500',
        description: 'Colossal ringed gas giant with swirling atmospheric storm vortexes.'
      },
      {
        id: 'planet-boreas',
        name: 'ICE WORLD BOREAS',
        category: 'planet',
        position: [220, -40, 240],
        scale: ['deep_space'],
        color: 'bg-sky-300',
        description: 'Sub-zero cryo-world covered with nitrogen-methane permafrost glaciers.'
      },
      {
        id: 'planet-pyros',
        name: 'VOLCANIC PYROS',
        category: 'planet',
        position: [-180, -30, 260],
        scale: ['deep_space'],
        color: 'bg-rose-500',
        description: 'Tidally locked volcanic body with molten basalt seas and thermal vents.'
      }
    ];

    return list;
  }, [playerPos, isAstronaut, planetaryPOIs]);

  // World-to-Map projection based on map tier
  const projectCoords = (pos: [number, number, number]): { x: number; y: number } => {
    let span = 100;
    if (mapScale === 'surface') span = 120;
    else if (mapScale === 'orbit') span = 90;
    else if (mapScale === 'system') span = 260;
    else span = 360;

    // Center map around origin (0, 0)
    // Convert 3D X & Z coordinates to 0% - 100% percentage
    const u = 50 + (pos[0] / (span * 2)) * 100;
    const v = 50 + (pos[2] / (span * 2)) * 100;

    return {
      x: Math.max(2, Math.min(98, u)),
      y: Math.max(2, Math.min(98, v))
    };
  };

  // Filter entities
  const visibleEntities = useMemo(() => {
    return allEntities.filter((e) => {
      // Scale check
      if (!e.scale.includes(mapScale)) return false;

      // Category check
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'PLAYER') return e.category === 'player';
      if (activeFilter === 'COLONY') return e.category === 'colony';
      if (activeFilter === 'STATIONS') return e.category === 'station';
      if (activeFilter === 'SATELLITES') return e.category === 'satellite';
      if (activeFilter === 'ASTEROIDS') return e.category === 'asteroid';
      if (activeFilter === 'UFO') return e.category === 'ufo';
      if (activeFilter === 'RESOURCES') return e.category === 'resource';
      return true;
    });
  }, [allEntities, mapScale, activeFilter]);

  // Distance computation relative to player
  const targetDistance = useMemo(() => {
    if (!selectedEntity) return null;
    const dx = selectedEntity.position[0] - playerPos[0];
    const dy = selectedEntity.position[1] - playerPos[1];
    const dz = selectedEntity.position[2] - playerPos[2];
    const horizontal = Math.hypot(dx, dz);
    const vertical = dy;
    const total = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return { horizontal, vertical, total };
  }, [selectedEntity, playerPos]);

  // Handle Pan Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setFollowPlayer(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Center on player
  const handleCenterPlayer = () => {
    nexusAudio.playConfirm();
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
    setFollowPlayer(true);
  };

  // Set / Clear 3D Waypoint
  const handleSetWaypoint = () => {
    if (!selectedEntity) return;
    setWaypoint({
      id: selectedEntity.id,
      name: selectedEntity.name,
      position: selectedEntity.position,
      type: selectedEntity.category
    });
  };

  const scaleTabs: { key: MapScaleLevel; label: string; icon: any }[] = [
    { key: 'surface', label: 'SURFACE', icon: Compass },
    { key: 'orbit', label: 'ORBIT', icon: Globe },
    { key: 'system', label: 'SYSTEM', icon: CircleDot },
    { key: 'deep_space', label: 'DEEP SPACE', icon: Sparkles }
  ];

  const filters = ['ALL', 'PLAYER', 'COLONY', 'STATIONS', 'SATELLITES', 'ASTEROIDS', 'UFO', 'RESOURCES'];

  return (
    <NexusModal
      isOpen={activeModal === 'map'}
      onClose={closeModal}
      title="NEXUS NAVIGATION MAP 3.0"
      subtitle="UNIFIED 3D SYNCHRONIZED TACTICAL CARTOGRAPHY"
      badge={isAstronaut ? 'SURFACE MODE' : 'SPACEFLIGHT MODE'}
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-3 font-mono select-none">
        {/* Top Control Bar: Scales & Filters */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 flex-wrap gap-2">
          {/* Scale Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-md border border-cyan-500/25">
            {scaleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = mapScale === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    nexusAudio.playClick(1000);
                    setMapScale(tab.key);
                    setSelectedEntity(null);
                  }}
                  className={'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ' + (
                    isActive
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Map Controls (Zoom, Reset, Follow) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCenterPlayer}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold border transition ${
                followPlayer
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>FOLLOW PLAYER</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-500 font-bold flex items-center gap-1 pr-1">
            <Filter className="w-3 h-3" /> FILTER:
          </span>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                nexusAudio.playClick(900);
                setActiveFilter(f);
              }}
              className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
                activeFilter === f
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tactical 2D Map Grid & Entity Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Map Viewport (2 Cols on Large Screen) */}
          <div
            className="lg:col-span-2 relative aspect-[4/3] w-full rounded-lg bg-[#02050e] border border-cyan-500/30 overflow-hidden cursor-grab active:cursor-grabbing shadow-[inset_0_0_30px_rgba(6,182,212,0.15)]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Concentric Coordinate Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[85%] h-[85%] border border-cyan-400 rounded-full" />
              <div className="w-[55%] h-[55%] border border-cyan-400/80 rounded-full" />
              <div className="w-[25%] h-[25%] border border-cyan-400/60 rounded-full" />
              <div className="absolute w-full h-px bg-cyan-400" />
              <div className="absolute h-full w-px bg-cyan-400" />
            </div>

            {/* Scale Watermark */}
            <div className="absolute top-2.5 left-3 text-[10px] text-cyan-400/80 font-bold tracking-widest pointer-events-none">
              SECTOR GRID // {mapScale.toUpperCase()}
            </div>
            <div className="absolute bottom-2.5 left-3 text-[9px] text-slate-500 font-bold pointer-events-none">
              ZOOM: {(zoom * 100).toFixed(0)}% · SHARED REAL-WORLD COORDS
            </div>

            {/* Transformable Interactive Map Layer */}
            <div
              className="absolute inset-0 transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            >
              {/* Waypoint Trajectory Line on Map */}
              {activeWaypoint && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={`${projectCoords(playerPos).x}%`}
                    y1={`${projectCoords(playerPos).y}%`}
                    x2={`${projectCoords(activeWaypoint.position).x}%`}
                    y2={`${projectCoords(activeWaypoint.position).y}%`}
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />
                </svg>
              )}

              {/* Rendered Live World Entities */}
              {visibleEntities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                const isWaypoint = activeWaypoint?.id === entity.id;
                const isPlayer = entity.category === 'player';
                const { x, y } = projectCoords(entity.position);

                return (
                  <div
                    key={entity.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      nexusAudio.playClick(1200);
                      setSelectedEntity(entity);
                    }}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    {/* Pulsing Ripple for Player & Active Waypoint */}
                    {(isPlayer || isWaypoint) && (
                      <div className="absolute inset-0 -m-2 rounded-full border border-cyan-400 animate-ping opacity-60 pointer-events-none" />
                    )}

                    {/* Marker Dot */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full ${entity.color} border transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? 'border-white scale-125 shadow-[0_0_15px_#38bdf8]'
                          : isPlayer
                          ? 'border-cyan-200 shadow-[0_0_10px_#38bdf8]'
                          : 'border-slate-800 hover:scale-110'
                      }`}
                    >
                      {isPlayer && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>

                    {/* Hover Badge */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[9px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-30">
                      {entity.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Entity Telemetry & Waypoint Locker */}
          <div className="bg-slate-950/80 border border-cyan-500/25 rounded-lg p-4 flex flex-col justify-between space-y-4">
            {selectedEntity ? (
              <div className="space-y-3">
                <div className="border-b border-cyan-500/20 pb-2">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    {selectedEntity.category} · TARGET ACQUIRED
                  </div>
                  <div className="text-sm font-bold text-slate-100 tracking-wide">
                    {selectedEntity.name}
                  </div>
                </div>

                {/* 3D Real-World Coordinates Readout */}
                <div className="bg-slate-900/80 rounded p-2.5 border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    WORLD COORDINATES (X, Y, Z)
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                    <div>X: <span className="text-cyan-300 font-bold">{selectedEntity.position[0].toFixed(1)}</span></div>
                    <div>ALT (Y): <span className="text-amber-300 font-bold">{selectedEntity.position[1].toFixed(1)}</span></div>
                    <div>Z: <span className="text-cyan-300 font-bold">{selectedEntity.position[2].toFixed(1)}</span></div>
                  </div>
                </div>

                {/* Relative Distance Breakdown */}
                {targetDistance && (
                  <div className="bg-slate-900/80 rounded p-2.5 border border-slate-800 space-y-1 text-xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      DISTANCE RELATIVE TO PLAYER
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">HORIZONTAL:</span>
                      <span className="font-bold text-slate-200">
                        {targetDistance.horizontal >= 10 ? (targetDistance.horizontal * 0.1).toFixed(1) + ' KM' : Math.round(targetDistance.horizontal * 10) + ' M'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">ALTITUDE DELTA:</span>
                      <span className="font-bold text-slate-200">
                        {(targetDistance.vertical >= 0 ? '+' : '') + Math.round(targetDistance.vertical * 10) + ' M'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-cyan-400 font-bold">VECTOR TOTAL:</span>
                      <span className="font-bold text-cyan-300">
                        {targetDistance.total >= 10 ? (targetDistance.total * 0.1).toFixed(1) + ' KM' : Math.round(targetDistance.total * 10) + ' M'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
                  {selectedEntity.description}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Navigation className="w-8 h-8 text-cyan-500/40 animate-pulse" />
                <div className="text-xs font-bold text-slate-400">NO TARGET SELECTED</div>
                <div className="text-[11px] text-slate-500">
                  Click any landmark, station, resource, or POI on the tactical map to inspect coordinates and lock 3D waypoints.
                </div>
              </div>
            )}

            {/* Waypoint Actions */}
            {selectedEntity && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                {activeWaypoint?.id === selectedEntity.id ? (
                  <NexusButton
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={clearWaypoint}
                  >
                    DISENGAGE 3D WAYPOINT
                  </NexusButton>
                ) : (
                  <NexusButton
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={handleSetWaypoint}
                  >
                    LOCK 3D WAYPOINT & ROUTE
                  </NexusButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </NexusModal>
  );
};
