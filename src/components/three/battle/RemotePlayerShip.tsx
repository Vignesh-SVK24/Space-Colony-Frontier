import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipModel } from '../spaceships/SpaceshipModel';
import { SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

export const RemotePlayerShip: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const opponentState = useMultiplayerStore(state => state.opponentState);
  
  const targetPos = useRef(new THREE.Vector3());
  const targetQuat = useRef(new THREE.Quaternion());

  const getPaintScheme = (color: string): SpaceshipPaintSchemeKey => {
    switch(color) {
      case 'yellow': return 'battle_yellow';
      case 'blue': return 'battle_blue';
      case 'red': return 'battle_red';
      case 'green': return 'battle_green';
      default: return 'battle_yellow';
    }
  };

  const nameTexture = useMemo(() => {
    if (!opponentState) return null;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opponentState.name || 'Opponent', 256, 40);
      
      // HP Bar
      const hpPercent = Math.max(0, opponentState.hp / 100);
      ctx.fillStyle = 'red';
      ctx.fillRect(56, 70, 400, 20);
      ctx.fillStyle = hpPercent > 0.6 ? 'lime' : hpPercent > 0.3 ? 'yellow' : 'red';
      ctx.fillRect(56, 70, 400 * hpPercent, 20);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [opponentState?.name, opponentState?.hp]);

  useFrame((_, delta) => {
    if (!group.current || !opponentState) return;
    
    targetPos.current.set(opponentState.position[0], opponentState.position[1], opponentState.position[2]);
    const euler = new THREE.Euler(opponentState.rotation[0], opponentState.rotation[1], opponentState.rotation[2], 'YXZ');
    targetQuat.current.setFromEuler(euler);

    group.current.position.lerp(targetPos.current, delta * 10);
    group.current.quaternion.slerp(targetQuat.current, delta * 10);
  });

  if (!opponentState) return null;

  const velMag = opponentState.velocity
    ? Math.hypot(opponentState.velocity[0], opponentState.velocity[1], opponentState.velocity[2])
    : 0;

  return (
    <group ref={group}>
      <SpaceshipModel 
        paintScheme={getPaintScheme(opponentState.color)} 
        throttle={Math.min(velMag / 50, 1)}
        isBoosting={opponentState.isBoosting}
        damaged={opponentState.hp < 40}
      />
      {nameTexture && (
        <sprite position={[0, 4, 0]} scale={[8, 2, 1]}>
          <spriteMaterial map={nameTexture} sizeAttenuation={true} depthTest={false} />
        </sprite>
      )}
    </group>
  );
};
