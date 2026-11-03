import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { ARENA_OBSTACLES, ArenaObstacle } from '../../../config/arenaObstacles';
import { getAsteroidFacetNormal, getBrushedMetalNormal } from '../../../utils/pbrTextureGenerator';

/**
 * 3D Mesh Component for a Giant Asteroid / Rock Obstacle
 * Enhanced with procedural bumpy surface displacement and PBR normal mapping.
 * Absolutely zero grid rings, zero wireframes.
 */
const AsteroidObstacleMesh: React.FC<{ obstacle: ArenaObstacle }> = ({ obstacle }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { radius, position } = obstacle;
  const facetNormal = useMemo(() => getAsteroidFacetNormal(), []);

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
      vertex.multiplyScalar(1 + noise * 0.16);
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius, obstacle.id]);

  const rockColor = obstacle.type === 'rock' ? '#1e2838' : '#17202e';

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.015;
      meshRef.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={rockColor}
          roughness={0.88}
          metalness={0.22}
          normalMap={facetNormal}
          flatShading={false}
        />
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
  const metalNormal = useMemo(() => getBrushedMetalNormal(), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.025;
    }
    if (beaconRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      beaconRef.current.intensity = 1.0 + pulse * 3.5;
    }
  });

  const { position, radius } = obstacle;

  return (
    <group ref={groupRef} position={position}>
      {/* Central Command Spire */}
      <mesh rotation={[0, 0, Math.PI / 6]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.25, radius * 0.35, radius * 1.8, 16]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.82}
          roughness={0.28}
          normalMap={metalNormal}
        />
      </mesh>

      {/* Primary Torus Habitat Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[radius * 0.75, radius * 0.12, 12, 32]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.78}
          roughness={0.32}
          normalMap={metalNormal}
        />
      </mesh>

      {/* Solar Array Wings */}
      <mesh position={[radius * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[radius * 0.8, 0.4, radius * 0.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.92} roughness={0.12} />
      </mesh>
      <mesh position={[-radius * 0.9, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[radius * 0.8, 0.4, radius * 0.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.92} roughness={0.12} />
      </mesh>

      {/* Emergency Hazard Beacon */}
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
  const metalNormal = useMemo(() => getBrushedMetalNormal(), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.012;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Heavy Battleship Armor Hull Plate */}
      <mesh rotation={[0.4, 0.5, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[radius * 1.5, radius * 0.3, radius * 0.9]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.88}
          roughness={0.38}
          normalMap={metalNormal}
        />
      </mesh>

      {/* Fractured Engine Nacelle */}
      <mesh position={[radius * 0.4, -radius * 0.3, radius * 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius * 0.25, radius * 0.3, radius * 0.9, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.45} />
      </mesh>

      {/* Structural Ribs */}
      <mesh position={[-radius * 0.5, radius * 0.2, -radius * 0.3]} rotation={[0.2, 0.8, 0]}>
        <torusGeometry args={[radius * 0.45, 0.8, 8, 16, Math.PI * 1.2]} />
        <meshStandardMaterial color="#475569" metalness={0.72} roughness={0.48} />
      </mesh>

      {/* Flickering Hazard Warning Beacon */}
      <pointLight color="#f59e0b" distance={45} intensity={2.0} position={[0, radius * 0.4, 0]} />
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
      groupRef.current.rotation.y -= delta * 0.018;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <instancedMesh ref={instancedRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#475569" roughness={0.88} metalness={0.24} flatShading={false} />
      </instancedMesh>
    </group>
  );
};

/**
 * BattleArena:
 * Houses the physical cover obstacles in the space dogfight arena.
 * All artificial wireframe spheres, equator rings, proximity rings, and flat floor planes
 * have been completely removed for a natural, cinematic deep-space battlefield.
 * Physics boundaries (300m radius) remain strictly enforced by server & client flight code.
 */
export const BattleArena: React.FC = () => {
  return (
    <group>
      {/* Physical 3D Tactical Cover Obstacles */}
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
