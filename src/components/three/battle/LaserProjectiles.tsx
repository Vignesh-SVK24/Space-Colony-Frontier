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
  const localProjectiles = useRef(new Map<string, { pos: THREE.Vector3; dir: THREE.Vector3 }>());

  useFrame((_, delta) => {
    if (!group.current) return;
    
    const bulletSpeed = GAME_CONFIG.BULLET_SPEED || 260;

    // Client-side prediction & interpolation with authoritative snapshot
    projectiles.forEach(p => {
      let loc = localProjectiles.current.get(p.id);
      const incomingPos = new THREE.Vector3().fromArray(p.position);
      const incomingDir = new THREE.Vector3().fromArray(p.direction).normalize();

      if (!loc) {
        loc = { pos: incomingPos.clone(), dir: incomingDir };
        localProjectiles.current.set(p.id, loc);
      } else {
        loc.pos.lerp(incomingPos, Math.min(1, delta * 15));
        loc.pos.addScaledVector(loc.dir, bulletSpeed * delta);
      }
    });

    // Cleanup expired projectiles
    const activeIds = new Set(projectiles.map(p => p.id));
    for (const [id] of localProjectiles.current) {
      if (!activeIds.has(id)) {
        localProjectiles.current.delete(id);
      }
    }
    
    // Position and align projectile tracer groups
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
        const color = COLOR_MAP[p.color] || '#8ccdeb';
        return (
          <group key={p.id}>
            {/* Slim bright needle core (sharp aerodynamic profile) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 2.2, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Soft, controlled radiant plasma sleeve (non-blinding glow) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 2.6, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
            </mesh>
            {/* Tapered aerodynamic energy wake trail */}
            <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.14, 1.4, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.35} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
