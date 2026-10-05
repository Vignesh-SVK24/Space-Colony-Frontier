import { useMemo, useRef, useEffect, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { getAsteroidFacetNormal } from '../../../utils/pbrTextureGenerator';

function createSeededRng(initialSeed: number) {
  let s = initialSeed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const ExpandedAsteroidBelts: FC = () => {
  const ironMeshRef = useRef<THREE.InstancedMesh>(null);
  const titaniumMeshRef = useRef<THREE.InstancedMesh>(null);
  const iceMeshRef = useRef<THREE.InstancedMesh>(null);
  const debrisMeshRef = useRef<THREE.InstancedMesh>(null);

  const { selectEntity, setHoveredEntity } = useNexusGameStore();
  const facetNormal = useMemo(() => getAsteroidFacetNormal(), []);

  // Sector Alpha: Iron Asteroids (Deterministic Seed 101)
  const ironCount = 75;
  const ironTransforms = useMemo(() => {
    const rng = createSeededRng(101);
    const temp = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < ironCount; i++) {
      const angle = (i / ironCount) * Math.PI * 2;
      const r = 110 + (rng() - 0.5) * 30;
      const y = (rng() - 0.5) * 22;
      temp.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      temp.rotation.set(rng() * Math.PI, rng() * Math.PI, 0);
      const s = 1.2 + rng() * 2.8;
      temp.scale.set(s, s * 0.8, s * 1.1);
      temp.updateMatrix();
      matrices.push(temp.matrix.clone());
    }
    return matrices;
  }, [ironCount]);

  // Sector Beta: Titanium Asteroids (Deterministic Seed 202)
  const titaniumCount = 45;
  const titaniumTransforms = useMemo(() => {
    const rng = createSeededRng(202);
    const temp = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < titaniumCount; i++) {
      const x = -140 + (rng() - 0.5) * 55;
      const y = 45 + (rng() - 0.5) * 35;
      const z = 120 + (rng() - 0.5) * 55;
      temp.position.set(x, y, z);
      temp.rotation.set(rng() * Math.PI, rng() * Math.PI, 0);
      const s = 1.5 + rng() * 3.5;
      temp.scale.set(s, s, s);
      temp.updateMatrix();
      matrices.push(temp.matrix.clone());
    }
    return matrices;
  }, [titaniumCount]);

  // Sector Gamma: Glacial Water Ice Cluster (Deterministic Seed 303)
  const iceCount = 40;
  const iceTransforms = useMemo(() => {
    const rng = createSeededRng(303);
    const temp = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < iceCount; i++) {
      const x = 180 + (rng() - 0.5) * 50;
      const y = -35 + (rng() - 0.5) * 30;
      const z = 160 + (rng() - 0.5) * 50;
      temp.position.set(x, y, z);
      temp.rotation.set(rng() * Math.PI, rng() * Math.PI, 0);
      const s = 1.0 + rng() * 2.4;
      temp.scale.set(s, s * 1.3, s);
      temp.updateMatrix();
      matrices.push(temp.matrix.clone());
    }
    return matrices;
  }, [iceCount]);

  // Space Debris: Satellite scrap & panels (Deterministic Seed 404)
  const debrisCount = 35;
  const debrisTransforms = useMemo(() => {
    const rng = createSeededRng(404);
    const temp = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < debrisCount; i++) {
      const angle = (i / debrisCount) * Math.PI * 2;
      const r = 70 + (rng() - 0.5) * 30;
      const y = 20 + (rng() - 0.5) * 25;
      temp.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      temp.rotation.set(rng() * Math.PI, rng() * Math.PI, 0);
      const s = 0.5 + rng() * 0.9;
      temp.scale.set(s, s * 0.2, s * 1.4);
      temp.updateMatrix();
      matrices.push(temp.matrix.clone());
    }
    return matrices;
  }, [debrisCount]);

  useEffect(() => {
    if (ironMeshRef.current) {
      ironTransforms.forEach((mat, i) => ironMeshRef.current?.setMatrixAt(i, mat));
      ironMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (titaniumMeshRef.current) {
      titaniumTransforms.forEach((mat, i) => titaniumMeshRef.current?.setMatrixAt(i, mat));
      titaniumMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (iceMeshRef.current) {
      iceTransforms.forEach((mat, i) => iceMeshRef.current?.setMatrixAt(i, mat));
      iceMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (debrisMeshRef.current) {
      debrisTransforms.forEach((mat, i) => debrisMeshRef.current?.setMatrixAt(i, mat));
      debrisMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [ironTransforms, titaniumTransforms, iceTransforms, debrisTransforms]);

  useFrame((_, delta) => {
    if (ironMeshRef.current) ironMeshRef.current.rotation.y += delta * 0.005;
    if (titaniumMeshRef.current) titaniumMeshRef.current.rotation.y += delta * 0.008;
    if (iceMeshRef.current) iceMeshRef.current.rotation.y -= delta * 0.006;
    if (debrisMeshRef.current) debrisMeshRef.current.rotation.y += delta * 0.015;
  });

  return (
    <group>
      {/* 1. Belt Alpha: Dense Iron Asteroid Ring */}
      <instancedMesh
        ref={ironMeshRef}
        args={[undefined, undefined, ironCount]}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity({
            id: 'belt-alpha-iron',
            name: 'ASTEROID BELT ALPHA (FERROUS ORE)',
            type: 'asteroid',
            status: 'HIGH-DENSITY ORE FIELD',
            distanceKm: 120,
            metrics: [
              { label: 'PRIMARY YIELD', value: 'IRON / BASALT' },
              { label: 'EST. RESERVES', value: '450,000', unit: 'TONS' },
              { label: 'STABILITY', value: 'FAIR' }
            ],
            actions: [
              { id: 'scan_iron_belt', label: 'SPECTRAL COMPOSITION MAP', variant: 'primary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'BELT ALPHA (IRON ASTEROIDS)',
            type: 'MINABLE FIELD',
            distanceM: 1200,
            actionPrompt: 'CLICK TO TARGET IN MINERAL RADAR'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.35} normalMap={facetNormal} />
      </instancedMesh>

      {/* 2. Belt Beta: Titanium / Rare Mineral Belt */}
      <instancedMesh
        ref={titaniumMeshRef}
        args={[undefined, undefined, titaniumCount]}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity({
            id: 'belt-beta-titanium',
            name: 'ASTEROID CLUSTER BETA (TITANIUM VEIN)',
            type: 'asteroid',
            status: 'PREMIUM AEROSPACE METALS',
            distanceKm: 160,
            metrics: [
              { label: 'TITANIUM GRADE', value: 'AEROSPACE GRADE-5' },
              { label: 'PURITY', value: '94.2', unit: '%' },
              { label: 'MINING RISK', value: 'LOW COLLISION' }
            ],
            actions: [
              { id: 'tag_titanium', label: 'TAG FOR MINING FREIGHTER', variant: 'primary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'CLUSTER BETA (TITANIUM DEPOSIT)',
            type: 'RICH MINERAL CLUSTER',
            distanceM: 1600,
            actionPrompt: 'CLICK TO SCAN VEIN QUALITY'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <octahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#253347" roughness={0.78} metalness={0.45} normalMap={facetNormal} />
      </instancedMesh>

      {/* 3. Belt Gamma: Water Ice Asteroids */}
      <instancedMesh
        ref={iceMeshRef}
        args={[undefined, undefined, iceCount]}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity({
            id: 'cluster-gamma-ice',
            name: 'GLACIAL ICE CLUSTER (RESOURCE NODE)',
            type: 'asteroid',
            status: 'VOLATILE EXTRACTION SITE',
            distanceKm: 210,
            metrics: [
              { label: 'WATER PURITY', value: '99.1', unit: '%' },
              { label: 'FUEL EXTRACTION', value: 'LIQUID H2 / LOX' },
              { label: 'TEMPERATURE', value: '38', unit: 'KELVIN' }
            ],
            actions: [
              { id: 'tag_ice', label: 'DEPLOY EXTRACTION DRONE', variant: 'primary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'CLUSTER GAMMA (WATER ICE)',
            type: 'FUEL VOLATILE SOURCE',
            distanceM: 2100,
            actionPrompt: 'CLICK TO ANALYZE VOLATILE YIELD'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8ccdeb" roughness={0.4} metalness={0.15} transparent opacity={0.88} />
      </instancedMesh>

      {/* 4. Orbital Debris Field */}
      <instancedMesh ref={debrisMeshRef} args={[undefined, undefined, debrisCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#334155" roughness={0.65} metalness={0.75} />
      </instancedMesh>
    </group>
  );
};
