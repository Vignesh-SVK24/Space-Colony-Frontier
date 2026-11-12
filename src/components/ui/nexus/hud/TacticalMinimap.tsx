import React, { useEffect, useRef, useState } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { ARENA_OBSTACLES, checkObstacleRaycast } from '../../../../config/arenaObstacles';
import { COMBAT_CONFIG } from '../../../../config/combatConfig';
import { Compass, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

const COLOR_HEX: Record<string, string> = {
  yellow: '#FFCC00',
  blue: '#38bdf8',
  red: '#ef4444',
  green: '#22c55e'
};

export const TacticalMinimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotateWithPlayer, setRotateWithPlayer] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const displaySize = isMobile ? (isExpanded ? 124 : 88) : (isExpanded ? 184 : 136);

  useEffect(() => {
    if (isCollapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastDraw = 0;

    const renderMinimap = (now: number) => {
      animId = requestAnimationFrame(renderMinimap);

      // Throttle redraws to ~30fps for zero CPU overhead while remaining buttery smooth
      if (now - lastDraw < 33) return;
      lastDraw = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.floor(displaySize * dpr);
      const targetH = Math.floor(displaySize * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displaySize, displaySize);

      const cx = displaySize / 2;
      const cy = displaySize / 2;
      const mapRadius = displaySize * 0.44;
      const arenaRadius = COMBAT_CONFIG.ARENA_RADIUS; // 300m
      const worldToPx = mapRadius / arenaRadius;

      const state = useMultiplayerStore.getState();
      const self = state.selfState;
      const gameMode = state.gameMode;
      const playerYaw = self ? self.rotation[1] : 0;

      // Helper: convert world (x, z) to minimap (px, py) with optional player-oriented rotation & clamping
      const toMapCoords = (wx: number, wz: number) => {
        let rx = wx;
        let rz = wz;
        if (rotateWithPlayer && self) {
          // Rotate world coordinates around origin or keep centered on arena with heading up
          const cos = Math.cos(playerYaw);
          const sin = Math.sin(playerYaw);
          rx = wx * cos - wz * sin;
          rz = wx * sin + wz * cos;
        }
        // Clamp to arena boundary so markers never escape the radar circle
        const dist = Math.hypot(rx, rz);
        if (dist > arenaRadius - 4) {
          const clampScale = (arenaRadius - 4) / dist;
          rx *= clampScale;
          rz *= clampScale;
        }
        return {
          x: cx + rx * worldToPx,
          y: cy + rz * worldToPx
        };
      };

      // 1. Radar Background Circle & Subtle Range Rings
      ctx.beginPath();
      ctx.arc(cx, cy, mapRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5, 7, 11, 0.72)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(140, 205, 235, 0.45)';
      ctx.stroke();

      // Inner 150m range ring
      ctx.beginPath();
      ctx.arc(cx, cy, mapRadius * 0.5, 0, Math.PI * 2);
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = 'rgba(140, 205, 235, 0.16)';
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - mapRadius, cy);
      ctx.lineTo(cx + mapRadius, cy);
      ctx.moveTo(cx, cy - mapRadius);
      ctx.lineTo(cx, cy + mapRadius);
      ctx.strokeStyle = 'rgba(140, 205, 235, 0.1)';
      ctx.stroke();

      // 2. Physical Obstacles & Cover Asteroids (Always Accurate)
      for (let i = 0; i < ARENA_OBSTACLES.length; i++) {
        const obs = ARENA_OBSTACLES[i];
        const pos = toMapCoords(obs.position[0], obs.position[2]);
        const rPx = Math.max(2.5, obs.radius * worldToPx);

        if (obs.type === 'station') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.strokeStyle = 'rgba(140, 205, 235, 0.8)';
          ctx.lineWidth = 1;
          ctx.fillRect(pos.x - rPx * 0.75, pos.y - rPx * 0.75, rPx * 1.5, rPx * 1.5);
          ctx.strokeRect(pos.x - rPx * 0.75, pos.y - rPx * 0.75, rPx * 1.5, rPx * 1.5);
        } else if (obs.type === 'wreck') {
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
          ctx.lineWidth = 1;
          ctx.fillRect(-rPx * 0.65, -rPx * 0.65, rPx * 1.3, rPx * 1.3);
          ctx.strokeRect(-rPx * 0.65, -rPx * 0.65, rPx * 1.3, rPx * 1.3);
          ctx.restore();
        } else if (obs.type === 'debris') {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, rPx * 0.65, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
          ctx.fill();
        } else {
          // Asteroid / Rock Cover
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, rPx, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(51, 65, 85, 0.78)';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.stroke();
        }
      }

      // 3. Opponents & Teammates (Respecting Radar Visibility & Cover Rules)
      const others = state.otherPlayers.length > 0
        ? state.otherPlayers
        : (state.opponentState ? [state.opponentState] : []);

      let nearestEnemyAngle: number | null = null;
      let nearestEnemyDist = Infinity;

      for (let i = 0; i < others.length; i++) {
        const opp = others[i];
        if (!opp || !opp.alive || opp.hp <= 0) continue;

        const isTeammate = Boolean(
          gameMode === '2v2' &&
          self &&
          self.team !== 'NONE' &&
          opp.team === self.team
        );

        let isDetected = true;
        let distToSelf = 0;

        if (self && !isTeammate) {
          distToSelf = Math.hypot(
            opp.position[0] - self.position[0],
            opp.position[1] - self.position[1],
            opp.position[2] - self.position[2]
          );

          // Proximity radar detects within 145m; beyond that requires unobstructed Line-of-Sight
          if (distToSelf >= 145) {
            const los = checkObstacleRaycast(
              self.position[0], self.position[1], self.position[2],
              opp.position[0], opp.position[1], opp.position[2]
            );
            if (los.blocked) {
              isDetected = false;
            }
          }
        }

        if (!isDetected) continue;

        const pos = toMapCoords(opp.position[0], opp.position[2]);
        const markerColor = COLOR_HEX[opp.color] || '#ef4444';

        if (isTeammate) {
          // Friendly teammate: filled circle with emerald ring
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, isMobile ? 3.5 : 4.2, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        } else {
          // Track nearest detected enemy for outer directional indicator
          if (self && distToSelf < nearestEnemyDist) {
            nearestEnemyDist = distToSelf;
            const selfMap = toMapCoords(self.position[0], self.position[2]);
            nearestEnemyAngle = Math.atan2(pos.y - selfMap.y, pos.x - selfMap.x);
          }

          // Enemy marker: outlined diamond
          const dSize = isMobile ? 4.2 : 5.2;
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = markerColor;
          ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(-dSize / 2, -dSize / 2, dSize, dSize);
          ctx.restore();
        }
      }

      // 4. Nearest Detected Opponent Directional Indicator on Radar Rim
      if (nearestEnemyAngle !== null) {
        const pipX = cx + Math.cos(nearestEnemyAngle) * (mapRadius + 2);
        const pipY = cy + Math.sin(nearestEnemyAngle) * (mapRadius + 2);
        ctx.save();
        ctx.translate(pipX, pipY);
        ctx.rotate(nearestEnemyAngle);
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-3, -3);
        ctx.lineTo(-3, 3);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.restore();
      }

      // 5. Local Player Directional Marker
      if (self) {
        const selfMap = toMapCoords(self.position[0], self.position[2]);
        const selfColor = COLOR_HEX[self.color] || '#FFCC00';

        // Heading vector in Three.js: forward is (sin(yaw), cos(yaw))
        const headingAngle = rotateWithPlayer
          ? -Math.PI / 2 // Pointing up when player-oriented
          : Math.atan2(Math.cos(playerYaw), Math.sin(playerYaw));

        // Subtle outer highlight ring
        ctx.beginPath();
        ctx.arc(selfMap.x, selfMap.y, isMobile ? 7.5 : 9.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Directional chevron
        const shipSize = isMobile ? 5.2 : 6.5;
        ctx.save();
        ctx.translate(selfMap.x, selfMap.y);
        ctx.rotate(headingAngle);
        ctx.beginPath();
        ctx.moveTo(shipSize, 0);
        ctx.lineTo(-shipSize * 0.75, -shipSize * 0.65);
        ctx.lineTo(-shipSize * 0.35, 0);
        ctx.lineTo(-shipSize * 0.75, shipSize * 0.65);
        ctx.closePath();
        ctx.fillStyle = selfColor;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(renderMinimap);
    return () => cancelAnimationFrame(animId);
  }, [isCollapsed, displaySize, isMobile, rotateWithPlayer]);

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => {
          nexusAudio.playClick();
          setIsCollapsed(false);
        }}
        className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05070B]/85 hover:bg-[#061A35] border border-[#8CCDEB]/40 text-[11px] text-[#8CCDEB] font-bold backdrop-blur-md shadow-lg cursor-pointer"
        title="Show Tactical Minimap"
      >
        <Eye size={13} />
        <span>RADAR</span>
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto relative rounded-xl bg-[#05070B]/85 border border-[#8CCDEB]/40 backdrop-blur-md shadow-[0_0_16px_rgba(140,205,235,0.16)] p-1 flex flex-col items-center transition-all duration-200"
      style={{ width: displaySize + 8 }}
    >
      {/* Top Bar Controls */}
      <div className="w-full flex items-center justify-between px-1 mb-0.5 text-[9px] text-[#8CCDEB]/85 font-bold">
        <span className="tracking-wider">RADAR</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              nexusAudio.playClick();
              setRotateWithPlayer(!rotateWithPlayer);
            }}
            className={`p-0.5 rounded hover:bg-[#08264A] transition-colors cursor-pointer ${
              rotateWithPlayer ? 'text-[#FFCC00]' : 'text-[#8CCDEB]/70'
            }`}
            title={rotateWithPlayer ? 'Orientation: Heading Up' : 'Orientation: Fixed North'}
          >
            <Compass size={11} />
          </button>
          <button
            type="button"
            onClick={() => {
              nexusAudio.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 rounded hover:bg-[#08264A] text-[#8CCDEB]/70 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Compact Size' : 'Expand Radar'}
          >
            {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
          <button
            type="button"
            onClick={() => {
              nexusAudio.playClick();
              setIsCollapsed(true);
            }}
            className="p-0.5 rounded hover:bg-[#08264A] text-[#8CCDEB]/70 hover:text-white transition-colors cursor-pointer"
            title="Hide Radar"
          >
            <EyeOff size={11} />
          </button>
        </div>
      </div>

      {/* Live 2D Tactical Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: displaySize, height: displaySize }}
        className="block rounded-lg"
      />
    </div>
  );
};
