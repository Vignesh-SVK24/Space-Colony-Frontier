import { useMemo, type FC } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from './terrainMath';

export const SurfaceTerrain: FC = () => {
  const { geometry } = useMemo(() => {
    const size = 300;
    const segments = 120;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors: number[] = [];

    const colorCenter = new THREE.Color('#1e293b');
    const colorBasalt = new THREE.Color('#334155');
    const colorForest = new THREE.Color('#065f46');
    const colorCrater = new THREE.Color('#3b0764');
    const colorRidge = new THREE.Color('#7c2d12');
    const colorSand = new THREE.Color('#475569');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const dOrigin = Math.hypot(x, z);
      const vColor = new THREE.Color();

      if (dOrigin < 20) {
        vColor.copy(colorCenter);
      } else if (x > 15 && z > 0) {
        const blend = THREE.MathUtils.clamp((x - 15) / 25, 0, 1);
        vColor.copy(colorBasalt).lerp(colorForest, blend);
      } else if (x < -18 && z > 15) {
        const blend = THREE.MathUtils.clamp(Math.abs(x + 18) / 20, 0, 1);
        vColor.copy(colorBasalt).lerp(colorCrater, blend);
      } else if (z < -15) {
        const blend = THREE.MathUtils.clamp(Math.abs(z + 15) / 25, 0, 1);
        vColor.copy(colorBasalt).lerp(colorRidge, blend);
      } else {
        vColor.copy(colorSand);
      }

      const heightFactor = (y - (-1.4)) * 0.05;
      vColor.offsetHSL(0, 0, THREE.MathUtils.clamp(heightFactor, -0.15, 0.15));

      colors.push(vColor.r, vColor.g, vColor.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    return { geometry: geom };
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.88}
        metalness={0.12}
      />
    </mesh>
  );
};
