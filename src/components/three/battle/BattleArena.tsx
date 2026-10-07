import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { ARENA_OBSTACLES, ArenaObstacle } from '../../../config/arenaObstacles';
import { COMBAT_CONFIG } from '../../../config/combatConfig';
import { AlienTerrainSurface } from './AlienTerrainSurface';

/**
 * 3D Mesh Component for a Giant Asteroid / Rock Obstacle
 */
const AsteroidObstacleMesh: React.FC<{ obstacle: ArenaObstacle }> = ({ obstacle }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { radius, position } = obstacle;

  // Generate slightly randomized bumpy asteroid geometry
  const geometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(radius, 2);
    const posAttr = geo.attributes.position;
    const vertex = new THREE.Vector3();
    // Deterministic seed based on id
    const seed = obstacle.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const noise = Math.sin(vertex.x * 0.3 + seed) * Math.cos(vertex.y * 0.3 + seed) * Math.sin(vertex.z * 0.3);
      vertex.multiplyScalar(1 + noise * 0.14);
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius, obstacle.id]);

  const rockColor = obstacle.type === 'rock' ? '#1c2433' : '#151d2a';

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
      meshRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={rockColor}
          roughness={0.86}
          metalness={0.24}
          flatShading
        />
      </mesh>
      {/* Subtle proximity marker ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.05, radius * 1.08, 32]} />
        <meshBasicMaterial color="#8ccdeb" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/**
 * 3D Mesh for Abandoned Orbital Space Station
 */
const SpaceStationObstacleMesh: React.FC<{ obstacle: ArenaObstacle }> = ({ obstacle }) => {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
    if (beaconRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      beaconRef.current.intensity = 1.0 + pulse * 4.0;
    }
  });

  const { position, radius } = obstacle;

  return (
    <group ref={groupRef} position={position}>
      {/* Central Command Spire */}
      <mesh rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[radius * 0.25, radius * 0.35, radius * 1.8, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Primary Torus Habitat Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.75, radius * 0.12, 12, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Solar Array Wings */}
      <mesh position={[radius * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[radius * 0.8, 0.4, radius * 0.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-radius * 0.9, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[radius * 0.8, 0.4, radius * 0.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Emergency Beacon */}
      <pointLight ref={beaconRef} color="#ef4444" distance={50} intensity={2.5} position={[0, radius * 0.9, 0]} />
      <mesh position={[0, radius * 0.9, 0]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
};

/**
 * 3D Mesh for Derelict Cruiser Wreck / Habitat Ring Ruin
 */
const CruiserWreckObstacleMesh: React.FC<{ obstacle: ArenaObstacle }> = ({ obstacle }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { position, radius } = obstacle;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Heavy Battleship Armor Hull Plate */}
      <mesh rotation={[0.4, 0.5, 0.2]}>
        <boxGeometry args={[radius * 1.5, radius * 0.3, radius * 0.9]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Fractured Engine Nacelle */}
      <mesh position={[radius * 0.4, -radius * 0.3, radius * 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.25, radius * 0.3, radius * 0.9, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.5} />
      </mesh>

      {/* Structural Ribs */}
      <mesh position={[-radius * 0.5, radius * 0.2, -radius * 0.3]} rotation={[0.2, 0.8, 0]}>
        <torusGeometry args={[radius * 0.45, 0.8, 8, 16, Math.PI * 1.2]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Flickering Hazard Warning Beacon */}
      <pointLight color="#f59e0b" distance={40} intensity={2.0} position={[0, radius * 0.4, 0]} />
    </group>
  );
};

/**
 * 3D Mesh for Debris Field Corridors (Optimized with InstancedMesh)
 */
const DebrisClusterMesh: React.FC<{ obstacle: ArenaObstacle }> = ({ obstacle }) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { position, radius } = obstacle;
  const count = 12;

  useEffect(() => {
    if (!instancedRef.current) return;
    const mesh = instancedRef.current;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const rot = new THREE.Euler();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = (radius * 0.4) + (i % 3) * (radius * 0.25);
      const y = ((i % 5) - 2) * (radius * 0.25);
      const s = 1.8 + (i % 4) * 1.2;
      pos.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
      rot.set(i * 0.5, i * 0.8, i * 0.3);
      quat.setFromEuler(rot);
      scale.set(s, s, s);
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.2} flatShading />
      </instancedMesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.95, radius, 24]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const _scratchPlayerPos = new THREE.Vector3();
const _scratchCyanColor = new THREE.Color('#06b6d4');
const _scratchRedColor = new THREE.Color('#ef4444');
const _scratchTargetColor = new THREE.Color();

export const BattleArena: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const selfState = useMultiplayerStore(state => state.selfState);

  useFrame((state, delta) => {
    if (!materialRef.current || !selfState) return;

    _scratchPlayerPos.fromArray(selfState.position);
    const dist = _scratchPlayerPos.length();
    
    // 300m boundary radius
    const boundaryRadius = COMBAT_CONFIG.ARENA_RADIUS;
    const margin = 50;
    
    let targetOpacity = 0.025;
    _scratchTargetColor.copy(_scratchCyanColor); // Cyan default
    
    if (dist > boundaryRadius - margin) {
      const intensity = Math.min(1, (dist - (boundaryRadius - margin)) / margin);
      targetOpacity = THREE.MathUtils.lerp(0.025, 0.18, intensity);
      
      const pulse = (Math.sin(state.clock.elapsedTime * 12) + 1) / 2;
      targetOpacity += pulse * 0.08 * intensity;
      
      _scratchTargetColor.lerp(_scratchRedColor, intensity); // Lerp to red warning
    }
    
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 5);
    materialRef.current.color.lerp(_scratchTargetColor, delta * 5);
  });

  return (
    <group>
      {/* 300m Spherical Forcefield Boundary */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[COMBAT_CONFIG.ARENA_RADIUS, 36, 36]} />
        <meshBasicMaterial 
          ref={materialRef}
          wireframe 
          transparent 
          opacity={0.025} 
          color="#06b6d4" 
          side={THREE.BackSide}
        />
      </mesh>

      {/* Concentric Arena Equator Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[COMBAT_CONFIG.ARENA_RADIUS - 0.5, COMBAT_CONFIG.ARENA_RADIUS, 64]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Planetary Alien Battlefield Terrain Boundary Floor */}
      <AlienTerrainSurface />

      {/* Render all Physical 3D Obstacles */}
      {ARENA_OBSTACLES.map(obstacle => {
        if (obstacle.type === 'station') {
          return <SpaceStationObstacleMesh key={obstacle.id} obstacle={obstacle} />;
        }
        if (obstacle.type === 'wreck') {
          return <CruiserWreckObstacleMesh key={obstacle.id} obstacle={obstacle} />;
        }
        if (obstacle.type === 'debris') {
          return <DebrisClusterMesh key={obstacle.id} obstacle={obstacle} />;
        }
        return <AsteroidObstacleMesh key={obstacle.id} obstacle={obstacle} />;
      })}
    </group>
  );
};
