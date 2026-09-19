import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from './terrainMath';

export const SurfaceVegetation: FC = () => {
  const treeMeshRef = useRef<THREE.InstancedMesh>(null);
  const shrubMeshRef = useRef<THREE.InstancedMesh>(null);
  const rockMeshRef = useRef<THREE.InstancedMesh>(null);

  const { treeTransforms, shrubTransforms, rockTransforms } = useMemo(() => {
    const trees: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];
    const shrubs: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];
    const rocks: { pos: THREE.Vector3; scale: number; rotY: number }[] = [];

    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 90; i++) {
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

    for (let i = 0; i < 130; i++) {
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

    for (let i = 0; i < 110; i++) {
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

    return {
      treeTransforms: trees,
      shrubTransforms: shrubs,
      rockTransforms: rocks
    };
  }, []);

  useFrame((state) => {
    const dummy = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    if (treeMeshRef.current) {
      treeTransforms.forEach((t, i) => {
        const sway = Math.sin(time * 1.5 + t.pos.x * 0.1) * 0.03;
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
  });

  return (
    <group>
      <instancedMesh
        ref={treeMeshRef}
        args={[undefined, undefined, treeTransforms.length]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[1.6, 5.0, 6]} />
        <meshStandardMaterial
          color="#065f46"
          emissive="#10b981"
          emissiveIntensity={0.25}
          roughness={0.7}
        />
      </instancedMesh>

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

      <instancedMesh
        ref={rockMeshRef}
        args={[undefined, undefined, rockTransforms.length]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.9}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
};
