import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';

const COLOR_MAP: Record<string, string> = {
  yellow: '#eab308',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e'
};

export const LaserProjectiles: React.FC = () => {
  const projectiles = useMultiplayerStore(state => state.projectiles);
  const group = useRef<THREE.Group>(null);
  const localProjectiles = useRef(new Map<string, { pos: THREE.Vector3, dir: THREE.Vector3 }>());

  useFrame((_, delta) => {
    if (!group.current) return;
    
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
        loc.pos.addScaledVector(loc.dir, 145 * delta);
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
        const color = COLOR_MAP[p.color] || '#ffffff';
        return (
          <group key={p.id}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
            </mesh>
            <pointLight distance={10} intensity={2} color={color} />
          </group>
        );
      })}
    </group>
  );
};
