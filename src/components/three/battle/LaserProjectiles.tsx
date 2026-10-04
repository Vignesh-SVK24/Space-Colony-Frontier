import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { GAME_CONFIG } from '../../../shared/gameConfig';

const COLOR_MAP: Record<string, string> = {
  yellow: '#fbbf24',
  blue: '#60a5fa',
  red: '#f87171',
  green: '#4ade80'
};

export const LaserProjectiles: React.FC = () => {
  const projectiles = useMultiplayerStore(state => state.projectiles);
  const group = useRef<THREE.Group>(null);
  const localProjectiles = useRef(new Map<string, { pos: THREE.Vector3, dir: THREE.Vector3 }>());

  useFrame((_, delta) => {
    if (!group.current) return;
    
    const bulletSpeed = GAME_CONFIG.BULLET_SPEED || 260;

    // Client-side prediction & interpolation with authoritative position
    projectiles.forEach(p => {
      let loc = localProjectiles.current.get(p.id);
      const incomingPos = new THREE.Vector3().fromArray(p.position);
      const incomingDir = new THREE.Vector3().fromArray(p.direction).normalize();

      if (!loc) {
        loc = { pos: incomingPos.clone(), dir: incomingDir };
        localProjectiles.current.set(p.id, loc);
      } else {
        // Reconcile toward authoritative snapshot position and advance
        loc.pos.lerp(incomingPos, Math.min(1, delta * 15));
        loc.pos.addScaledVector(loc.dir, bulletSpeed * delta);
      }
    });

    // Cleanup old ones
    const activeIds = new Set(projectiles.map(p => p.id));
    for (const [id] of localProjectiles.current) {
      if (!activeIds.has(id)) {
        localProjectiles.current.delete(id);
      }
    }
    
    // Update mesh positions
    let i = 0;
    projectiles.forEach(p => {
      const child = group.current?.children[i] as THREE.Group;
      if (child) {
        const loc = localProjectiles.current.get(p.id);
        if (loc) {
          child.position.copy(loc.pos);
          const lookTarget = loc.pos.clone().add(loc.dir);
          child.lookAt(lookTarget);
        }
      }
      i++;
    });
  });

  return (
    <group ref={group}>
      {projectiles.map(p => {
        const color = COLOR_MAP[p.color] || '#38bdf8';
        return (
          <group key={p.id}>
            {/* High-intensity glowing plasma core */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 2.8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Outer radiant plasma envelope */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 3.4, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} />
            </mesh>
            <pointLight distance={15} intensity={3} color={color} />
          </group>
        );
      })}
    </group>
  );
};
