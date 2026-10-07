import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { GAME_CONFIG } from '../../../shared/gameConfig';

const MAX_PROJECTILES = 64;

const COLOR_MAP: Record<string, THREE.Color> = {
  yellow: new THREE.Color('#fbbf24'),
  blue: new THREE.Color('#60a5fa'),
  red: new THREE.Color('#f87171'),
  green: new THREE.Color('#4ade80'),
  default: new THREE.Color('#8ccdeb')
};

// Module-scoped scratch objects to ensure 0 per-frame GC allocations
const _scratchMatrix = new THREE.Matrix4();
const _scratchPos = new THREE.Vector3();
const _scratchIncomingPos = new THREE.Vector3();
const _scratchIncomingDir = new THREE.Vector3();
const _scratchDir = new THREE.Vector3();
const _scratchQuat = new THREE.Quaternion();
const _scratchScale = new THREE.Vector3(1, 1, 1);
const _forwardZ = new THREE.Vector3(0, 0, 1);

interface LocalProj {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  colorName: string;
}

export const LaserProjectiles: React.FC = () => {
  const projectiles = useMultiplayerStore(state => state.projectiles);
  
  const coreMeshRef = useRef<THREE.InstancedMesh>(null);
  const sleeveMeshRef = useRef<THREE.InstancedMesh>(null);
  const wakeMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const localProjectiles = useRef(new Map<string, LocalProj>());

  // Shared pre-built geometries
  const coreGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.065, 0.065, 2.2, 8);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  const sleeveGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.16, 0.16, 2.6, 8);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  const wakeGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.14, 1.4, 6);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, -1.2);
    return geo;
  }, []);

  // Shared pre-built materials
  const coreMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const sleeveMat = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);
  const wakeMat = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  // Cleanup geometries & materials on unmount
  useEffect(() => {
    return () => {
      coreGeo.dispose();
      sleeveGeo.dispose();
      wakeGeo.dispose();
      coreMat.dispose();
      sleeveMat.dispose();
      wakeMat.dispose();
    };
  }, [coreGeo, sleeveGeo, wakeGeo, coreMat, sleeveMat, wakeMat]);

  useFrame((_, delta) => {
    const coreMesh = coreMeshRef.current;
    const sleeveMesh = sleeveMeshRef.current;
    const wakeMesh = wakeMeshRef.current;
    if (!coreMesh || !sleeveMesh || !wakeMesh) return;

    const bulletSpeed = GAME_CONFIG.BULLET_SPEED || 260;
    const activeMap = localProjectiles.current;

    // 1. Synchronize incoming state snapshots without per-frame garbage
    for (let pIdx = 0; pIdx < projectiles.length; pIdx++) {
      const p = projectiles[pIdx];
      let loc = activeMap.get(p.id);
      
      _scratchIncomingPos.set(p.position[0], p.position[1], p.position[2]);
      _scratchIncomingDir.set(p.direction[0], p.direction[1], p.direction[2]).normalize();

      if (!loc) {
        loc = {
          pos: _scratchIncomingPos.clone(),
          dir: _scratchIncomingDir.clone(),
          colorName: p.color || 'yellow'
        };
        activeMap.set(p.id, loc);
      } else {
        loc.pos.lerp(_scratchIncomingPos, Math.min(1, delta * 15));
        loc.pos.addScaledVector(loc.dir, bulletSpeed * delta);
        loc.colorName = p.color || 'yellow';
      }
    }

    // 2. Prune expired entries
    if (activeMap.size > projectiles.length) {
      for (const [id] of activeMap) {
        let exists = false;
        for (let j = 0; j < projectiles.length; j++) {
          if (projectiles[j].id === id) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          activeMap.delete(id);
        }
      }
    }

    // 3. Update InstancedMesh matrices and colors in one batch
    let renderCount = 0;
    for (const [, loc] of activeMap) {
      if (renderCount >= MAX_PROJECTILES) break;

      _scratchPos.copy(loc.pos);
      _scratchDir.copy(loc.dir).normalize();
      _scratchQuat.setFromUnitVectors(_forwardZ, _scratchDir);
      _scratchMatrix.compose(_scratchPos, _scratchQuat, _scratchScale);

      coreMesh.setMatrixAt(renderCount, _scratchMatrix);
      sleeveMesh.setMatrixAt(renderCount, _scratchMatrix);
      wakeMesh.setMatrixAt(renderCount, _scratchMatrix);

      const col = COLOR_MAP[loc.colorName] || COLOR_MAP.default;
      sleeveMesh.setColorAt(renderCount, col);
      wakeMesh.setColorAt(renderCount, col);

      renderCount++;
    }

    // Set active count for instanced rendering
    coreMesh.count = renderCount;
    sleeveMesh.count = renderCount;
    wakeMesh.count = renderCount;

    if (renderCount > 0) {
      coreMesh.instanceMatrix.needsUpdate = true;
      sleeveMesh.instanceMatrix.needsUpdate = true;
      wakeMesh.instanceMatrix.needsUpdate = true;
      if (sleeveMesh.instanceColor) sleeveMesh.instanceColor.needsUpdate = true;
      if (wakeMesh.instanceColor) wakeMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={coreMeshRef}
        args={[coreGeo, coreMat, MAX_PROJECTILES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={sleeveMeshRef}
        args={[sleeveGeo, sleeveMat, MAX_PROJECTILES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={wakeMeshRef}
        args={[wakeGeo, wakeMat, MAX_PROJECTILES]}
        frustumCulled={false}
      />
    </group>
  );
};
