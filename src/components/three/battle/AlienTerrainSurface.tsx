import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight, TERRAIN_CONFIG } from '../../../config/terrainPhysics';

/**
 * 3D Planetary Alien Battlefield Terrain
 * Creates a vast, realistic dark blue-black rocky surface with navy shading,
 * warm amber/gold mineral ridges, and emerald crystal fissure accents.
 * 
 * Vertices are procedurally generated to match getTerrainHeight() with 100% precision.
 */
export const AlienTerrainSurface: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ventLightRef = useRef<THREE.PointLight>(null);

  const { geometry } = useMemo(() => {
    const segments = 90;
    const size = 600; // 600m diameter to cover the 300m arena radius
    const planeGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    planeGeo.rotateX(-Math.PI / 2); // Orient horizontal (XZ plane)

    const posAttr = planeGeo.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    const baseRockColor = new THREE.Color('#060c18'); // Dark blue-black basalt
    const navyCreviceColor = new THREE.Color('#040914'); // Deepest navy shadows
    const amberRidgeColor = new THREE.Color('#d97706'); // Warm amber mineral crests
    const goldHighlightColor = new THREE.Color('#f59e0b'); // Gold specular rims
    const emeraldFissureColor = new THREE.Color('#10b981'); // Emerald alien crystal veins

    const tempColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Compute exact physical terrain elevation
      const y = getTerrainHeight(x, z);
      posAttr.setY(i, y);

      // Vertex color blending based on elevation & landmarks
      const elevationRel = (y - TERRAIN_CONFIG.BASE_Y);

      if (elevationRel > 15) {
        // High ridges & mesa summits receive warm amber/gold mineral deposit colors
        const t = Math.min(1.0, (elevationRel - 15) / 20);
        tempColor.copy(baseRockColor).lerp(amberRidgeColor, t * 0.7);
        if (elevationRel > 25) {
          tempColor.lerp(goldHighlightColor, 0.4);
        }
      } else if (elevationRel < -10) {
        // Canyon depths & crater basins receive deep navy or emerald fissure accents
        const t = Math.min(1.0, Math.abs(elevationRel + 10) / 15);
        // Emerald vein in central canyon
        if (Math.abs(z - TERRAIN_CONFIG.CANYON.centerZ) < 18) {
          tempColor.copy(baseRockColor).lerp(emeraldFissureColor, t * 0.65);
        } else {
          tempColor.copy(baseRockColor).lerp(navyCreviceColor, t * 0.85);
        }
      } else {
        tempColor.copy(baseRockColor);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    planeGeo.computeVertexNormals();

    return { geometry: planeGeo };
  }, []);

  useFrame((state) => {
    if (ventLightRef.current) {
      // Subtle organic pulsing of the emerald geothermal fissure light
      const pulse = Math.sin(state.clock.elapsedTime * 2.0) * 0.2 + 0.8;
      ventLightRef.current.intensity = 1.2 * pulse;
    }
  });

  return (
    <group>
      {/* Primary PBR Alien Terrain Mesh */}
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.22}
          flatShading={false}
        />
      </mesh>

      {/* Geothermal Emerald Thermal Fissure localized accent light */}
      <pointLight
        ref={ventLightRef}
        position={[0, -135, TERRAIN_CONFIG.CANYON.centerZ]}
        color="#10b981"
        distance={65}
        intensity={1.2}
      />

      {/* Subtle Warm Amber Ridge Mineral Beacon */}
      <pointLight
        position={[-50, -88, 55]}
        color="#f59e0b"
        distance={55}
        intensity={0.8}
      />
    </group>
  );
};
