import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipModel } from '../spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { PlayerState } from '../../../multiplayer/types';

interface RemotePlayerShipProps {
  player: PlayerState;
}

export const RemotePlayerShip: React.FC<RemotePlayerShipProps> = ({ player }) => {
  const showCombatHitboxes = useMultiplayerStore(state => state.showCombatHitboxes);
  const matchSessionId = useMultiplayerStore(state => state.matchSessionId);
  const group = useRef<THREE.Group>(null);
  
  const currentPos = useRef(new THREE.Vector3());
  const currentQuat = useRef(new THREE.Quaternion());
  const targetPos = useRef(new THREE.Vector3());
  const targetQuat = useRef(new THREE.Quaternion());
  const targetVel = useRef(new THREE.Vector3());
  const lastPacketTime = useRef(performance.now());
  const initialPosSet = useRef(false);

  React.useEffect(() => {
    initialPosSet.current = false;
  }, [matchSessionId]);

  React.useEffect(() => {
    if (!player) return;
    targetPos.current.set(player.position[0], player.position[1], player.position[2]);
    if (player.velocity) {
      targetVel.current.set(player.velocity[0], player.velocity[1], player.velocity[2]);
    }
    const euler = new THREE.Euler(player.rotation[0], player.rotation[1], player.rotation[2], 'YXZ');
    targetQuat.current.setFromEuler(euler);
    lastPacketTime.current = performance.now();

    if (!initialPosSet.current) {
      currentPos.current.copy(targetPos.current);
      currentQuat.current.copy(targetQuat.current);
      if (group.current) {
        group.current.position.copy(targetPos.current);
        group.current.quaternion.copy(targetQuat.current);
      }
      initialPosSet.current = true;
    }
  }, [player?.position[0], player?.position[1], player?.position[2], player?.rotation[0], player?.rotation[1], player?.rotation[2]]);

  const getPaintScheme = (color: string): SpaceshipPaintSchemeKey => {
    switch (color) {
      case 'yellow': return 'battle_yellow';
      case 'blue': return 'battle_blue';
      case 'red': return 'battle_red';
      case 'green': return 'battle_green';
      default: return 'battle_yellow';
    }
  };

  const nameTexture = useMemo(() => {
    if (!player) return null;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = 'bold 44px monospace';
      ctx.fillStyle = player.alive ? 'white' : '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.alive ? (player.name || 'Pilot') : `${player.name || 'Pilot'} [ELIMINATED]`, 256, 38);
      
      // HP Bar
      const hpPercent = Math.max(0, player.hp / 250);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(56, 74, 400, 22);
      ctx.fillStyle = hpPercent > 0.6 ? '#22c55e' : hpPercent > 0.3 ? '#eab308' : '#ef4444';
      ctx.fillRect(56, 74, 400 * hpPercent, 22);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [player?.name, player?.hp, player?.alive]);

  useFrame((_, delta) => {
    if (!group.current || !player) return;
    
    const now = performance.now();
    const timeSincePacket = Math.min((now - lastPacketTime.current) / 1000, 0.20);

    // Dead Reckoning: Extrapolate position forward along velocity vector between network ticks
    const extrapolatedPos = targetPos.current.clone().addScaledVector(targetVel.current, timeSincePacket);

    // Smooth convergence without stuttering
    currentPos.current.lerp(extrapolatedPos, Math.min(1, delta * 15));
    currentQuat.current.slerp(targetQuat.current, Math.min(1, delta * 14));

    group.current.position.copy(currentPos.current);
    group.current.quaternion.copy(currentQuat.current);
  });

  if (!player) return null;
  // If destroyed in battle royale, ship is removed from arena
  if (!player.alive && player.hp <= 0) return null;

  const velMag = player.velocity
    ? Math.hypot(player.velocity[0], player.velocity[1], player.velocity[2])
    : 0;

  return (
    <group ref={group}>
      <SpaceshipModel 
        paintScheme={getPaintScheme(player.color)} 
        throttle={Math.min(velMag / 50, 1)}
        isBoosting={player.isBoosting}
        damaged={player.hp < 40}
      />
      {nameTexture && (
        <sprite position={[0, 4.5, 0]} scale={[8, 2, 1]}>
          <spriteMaterial map={nameTexture} sizeAttenuation={true} depthTest={false} />
        </sprite>
      )}
      {showCombatHitboxes && (
        <mesh>
          <sphereGeometry args={[4.8, 16, 16]} />
          <meshBasicMaterial wireframe color="#ff0055" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};
