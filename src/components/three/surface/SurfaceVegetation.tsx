import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from './terrainMath';
import { getAsteroidFacetNormal } from '../../../utils/pbrTextureGenerator';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const SurfaceVegetation: FC = () => {
  const { graphicsSettings } = useNexusGameStore();
  const treeMeshRef = useRef<THREE.InstancedMesh>(null);
  const shrubMeshRef = useRef<THREE.InstancedMesh>(null);
  const rockMeshRef = useRef<THREE.InstancedMesh>(null);
  const crystalMeshRef = useRef<THREE.InstancedMesh>(null);

  const rockNormal = useMemo(() => getAsteroidFacetNormal(), []);

  const counts = useMemo(() => {
    switch (graphicsSettings.vegetationDensity) {
      case 'low':
        return { trees: 40, shrubs: 60, rocks: 50, crystals: 30 };
      case 'medium':
        return { trees: 75, shrubs: 110, rocks: 90, crystals: 60 };
      case 'high':
      default:
        return { trees: 110, shrubs: 160, rocks: 130, crystals: 85 };
    }
  }, [graphicsSettings.vegetationDensity]);

  const { treeTransforms, shrubTransforms, rockTransforms, crystalTransforms } = useMemo(() => {
    const trees: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];
    const shrubs: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];
    const rocks: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];
    const crystals: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];

    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 1. Alien Conifer Trees
    for (let i = 0; i < counts.trees; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 24 + rand() * 110;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (x > 5 && z > -5) {
        const y = getTerrainHeight(x, z);
        trees.push({
          pos: new THREE.Vector3(x, y + 2.5, z),
          scale: 0.7 + rand() * 0.8,
          rotY: rand() * Math.PI * 2
        });
      }
    }

    // 2. Bioluminescent Spore Shrubs
    for (let i = 0; i < counts.shrubs; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 22 + rand() * 125;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      shrubs.push({
        pos: new THREE.Vector3(x, y + 0.5, z),
        scale: 0.5 + rand() * 0.7,
        rotY: rand() * Math.PI * 2
      });
    }

    // 3. Basalt Field Boulders
    for (let i = 0; i < counts.rocks; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 20 + rand() * 120;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      rocks.push({
        pos: new THREE.Vector3(x, y + 0.6, z),
        scale: 0.4 + rand() * 1.2,
        rotY: rand() * Math.PI * 2
      });
    }

    // 4. Xenocryst Spires
    for (let i = 0; i < counts.crystals; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 26 + rand() * 115;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (x < -10 && z > 10) {
        const y = getTerrainHeight(x, z);
        crystals.push({
          pos: new THREE.Vector3(x, y + 1.2, z),
          scale: 0.6 + rand() * 0.9,
          rotY: rand() * Math.PI * 2
        });
      }
    }

    return {
      treeTransforms: trees,
      shrubTransforms: shrubs,
      rockTransforms: rocks,
      crystalTransforms: crystals
    };
  }, [counts]);

  useFrame((state) => {
    const dummy = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    if (treeMeshRef.current) {
      treeTransforms.forEach((t, i) => {
        const sway = Math.sin(time * 1.6 + t.pos.x * 0.1) * 0.035;
        dummy.position.copy(t.pos);
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.rotation.set(sway, t.rotY, sway * 0.5);
        dummy.updateMatrix();
        treeMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      treeMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (shrubMeshRef.current) {
      shrubTransforms.forEach((s, i) => {
        dummy.position.copy(s.pos);
        dummy.scale.set(s.scale, s.scale, s.scale);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.updateMatrix();
        shrubMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      shrubMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (rockMeshRef.current) {
      rockTransforms.forEach((r, i) => {
        dummy.position.copy(r.pos);
        dummy.scale.set(r.scale, r.scale, r.scale);
        dummy.rotation.set(0, r.rotY, 0);
        dummy.updateMatrix();
        rockMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      rockMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (crystalMeshRef.current) {
      crystalTransforms.forEach((c, i) => {
        const pulse = 1.0 + Math.sin(time * 2.0 + c.pos.z) * 0.05;
        dummy.position.copy(c.pos);
        dummy.scale.set(c.scale, c.scale * pulse, c.scale);
        dummy.rotation.set(0, c.rotY, 0.1);
        dummy.updateMatrix();
        crystalMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      crystalMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Alien Conifer Trees */}
      <instancedMesh
        ref={treeMeshRef}
        args={[undefined, undefined, treeTransforms.length]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[1.6, 5.0, 7]} />
        <meshStandardMaterial
          color="#065f46"
          emissive="#10b981"
          emissiveIntensity={0.25}
          roughness={0.7}
        />
      </instancedMesh>

      {/* 2. Bioluminescent Spore Shrubs */}
      <instancedMesh
        ref={shrubMeshRef}
        args={[undefined, undefined, shrubTransforms.length]}
      >
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="#059669"
          emissive="#34d399"
          emissiveIntensity={0.65}
          roughness={0.5}
        />
      </instancedMesh>

      {/* 3. Basalt Rocks with Facet Normal Map */}
      <instancedMesh
        ref={rockMeshRef}
        args={[undefined, undefined, rockTransforms.length]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.88}
          metalness={0.15}
          normalMap={rockNormal}
        />
      </instancedMesh>

      {/* 4. Xenocryst Spires */}
      <instancedMesh
        ref={crystalMeshRef}
        args={[undefined, undefined, crystalTransforms.length]}
        castShadow
        receiveShadow
      >
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#c084fc"
          emissiveIntensity={0.7}
          roughness={0.1}
          metalness={0.9}
        />
      </instancedMesh>
    </group>
  );
};
