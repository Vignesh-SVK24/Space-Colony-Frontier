import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { nexusAudio } from '../../../utils/nexusAudio';
import { getAsteroidFacetNormal } from '../../../utils/pbrTextureGenerator';

interface DebrisItem {
  id: number;
  pos: THREE.Vector3;
  rot: THREE.Euler;
  scale: number;
  hp: number;
  maxHp: number;
  shattered: boolean;
  shatterTime: number;
}

const DEBRIS_COUNT = 14;

// Module scratch variables
const _tempMatrix = new THREE.Matrix4();
const _tempPos = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3();
const _projPos = new THREE.Vector3();

export const DestructibleDebrisField: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const projectiles = useMultiplayerStore(state => state.projectiles);
  const facetNormal = useMemo(() => getAsteroidFacetNormal(), []);

  // Initialize deterministic positions for destructible orbital debris
  const debrisList = useRef<DebrisItem[]>([]);

  useEffect(() => {
    const list: DebrisItem[] = [];
    const seedPositions: [number, number, number][] = [
      [35, 12, -45],
      [-42, -8, 38],
      [55, -15, 60],
      [-65, 18, -30],
      [20, 25, 75],
      [-30, -22, -80],
      [85, 5, -25],
      [-75, 10, 65],
      [40, -18, -90],
      [-50, 20, 95],
      [15, -12, 110],
      [-85, -14, -40],
      [68, 16, 40],
      [-25, 30, -60]
    ];

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const p = seedPositions[i % seedPositions.length];
      list.push({
        id: i,
        pos: new THREE.Vector3(p[0], p[1], p[2]),
        rot: new THREE.Euler(i * 0.4, i * 0.7, i * 0.2),
        scale: 2.2 + (i % 3) * 0.8,
        hp: 4,
        maxHp: 4,
        shattered: false,
        shatterTime: 0
      });
    }
    debrisList.current = list;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || debrisList.current.length === 0) return;
    const now = state.clock.elapsedTime;
    const mesh = meshRef.current;
    let needsUpdate = false;

    // Check projectile collisions against destructible debris
    for (let pIdx = 0; pIdx < projectiles.length; pIdx++) {
      const p = projectiles[pIdx];
      _projPos.set(p.position[0], p.position[1], p.position[2]);

      for (let dIdx = 0; dIdx < debrisList.current.length; dIdx++) {
        const item = debrisList.current[dIdx];
        if (item.shattered) continue;

        if (_projPos.distanceTo(item.pos) < item.scale + 1.2) {
          item.hp -= p.damage || 2;
          nexusAudio.playShieldOrHullHit(p.damage || 2);

          if (item.hp <= 0) {
            item.shattered = true;
            item.shatterTime = now;
            nexusAudio.playExplosion();
          }
          needsUpdate = true;
          break;
        }
      }
    }

    // Update instance transforms
    for (let i = 0; i < debrisList.current.length; i++) {
      const item = debrisList.current[i];
      if (item.shattered) {
        // Hide shattered debris below visible threshold
        _tempMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, _tempMatrix);
        needsUpdate = true;
      } else {
        item.rot.y += delta * 0.03;
        item.rot.x += delta * 0.015;
        _tempQuat.setFromEuler(item.rot);
        _tempScale.set(item.scale, item.scale, item.scale);
        _tempMatrix.compose(item.pos, _tempQuat, _tempScale);
        mesh.setMatrixAt(i, _tempMatrix);
      }
    }

    if (needsUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, DEBRIS_COUNT]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#334155"
        roughness={0.85}
        metalness={0.35}
        normalMap={facetNormal}
      />
    </instancedMesh>
  );
};
