import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import {
  getGasGiantTexture,
  getGasGiantRingsTexture,
  getColonyPlanetTexture,
  getVolcanicPlanetTexture,
  getTerrainRegolithNormal
} from '../../../utils/pbrTextureGenerator';

export const DistantPlanets: FC = () => {
  const gorgonRef = useRef<THREE.Group>(null);
  const boreasRef = useRef<THREE.Group>(null);
  const pyrosRef = useRef<THREE.Group>(null);
  const colonyPlanetRef = useRef<THREE.Group>(null);

  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  // Procedural planetary textures
  const gasGiantTex = useMemo(() => getGasGiantTexture(), []);
  const gasGiantRingsTex = useMemo(() => getGasGiantRingsTexture(), []);
  const colonyPlanetTex = useMemo(() => getColonyPlanetTexture(), []);
  const volcanicTex = useMemo(() => getVolcanicPlanetTexture(), []);
  const iceNormal = useMemo(() => getTerrainRegolithNormal(), []);

  useFrame((_, delta) => {
    if (gorgonRef.current) gorgonRef.current.rotation.y += delta * 0.012;
    if (boreasRef.current) boreasRef.current.rotation.y += delta * 0.015;
    if (pyrosRef.current) pyrosRef.current.rotation.y += delta * 0.02;
    if (colonyPlanetRef.current) colonyPlanetRef.current.rotation.y += delta * 0.003;
  });

  return (
    <group>
      {/* 1. Gorgon: Jovian Class-IV Ringed Gas Giant */}
      <group
        ref={gorgonRef}
        position={[-360, 130, -320]}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity({
            id: 'planet-gorgon',
            name: 'GORGON (GAS GIANT)',
            type: 'asteroid',
            status: 'UNINHABITABLE / HEAVY GRAVITY',
            distanceKm: 3400,
            metrics: [
              { label: 'CLASSIFICATION', value: 'JOVIAN CLASS-IV' },
              { label: 'ATMOSPHERE', value: 'H2 / HE / CH4' },
              { label: 'RING MASS', value: '4.8e18', unit: 'KG' },
              { label: 'MAGNETIC FIELD', value: '14.2', unit: 'TESLA' }
            ],
            actions: [
              { id: 'scan_gorgon', label: 'ATMOSPHERIC SPECTROMETRY', variant: 'primary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'GORGON (RINGED GAS GIANT)',
            type: 'DISTANT CELESTIAL BODY',
            distanceM: 34000,
            actionPrompt: 'CLICK TO TARGET IN SCANNER'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        {/* Core Gas Giant Sphere with Banded Cloud Texture */}
        <mesh>
          <sphereGeometry args={[26, 64, 64]} />
          <meshStandardMaterial
            map={gasGiantTex}
            roughness={0.75}
            metalness={0.05}
          />
        </mesh>

        {/* Soft Atmospheric Limb Glow Shell */}
        <mesh>
          <sphereGeometry args={[26.9, 32, 32]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.16}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Multi-Tiered Planetary Rings with Cassini Gap */}
        <mesh rotation={[-Math.PI / 2.3, 0.3, 0]}>
          <ringGeometry args={[32, 54, 64]} />
          <meshStandardMaterial
            map={gasGiantRingsTex}
            roughness={0.85}
            metalness={0.1}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* 2. Boreas: Glacial Cryo-Terrestrial World */}
      <group
        ref={boreasRef}
        position={[340, -100, -290]}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity({
            id: 'planet-boreas',
            name: 'BOREAS (FROZEN WORLD)',
            type: 'asteroid',
            status: 'COLD DESERT / CRYO-DEPOSITS',
            distanceKm: 2800,
            metrics: [
              { label: 'CLASSIFICATION', value: 'GLACIAL TERRESTRIAL' },
              { label: 'SURFACE TEMP', value: '-185', unit: '°C' },
              { label: 'WATER ICE', value: '78', unit: '%' },
              { label: 'CORE', value: 'NICKEL-IRON' }
            ],
            actions: [
              { id: 'scan_boreas', label: 'CRYO-MINERAL SURVEY', variant: 'primary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'BOREAS (GLACIAL WORLD)',
            type: 'DISTANT CELESTIAL BODY',
            distanceM: 28000,
            actionPrompt: 'CLICK TO TARGET IN SCANNER'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <mesh>
          <sphereGeometry args={[15, 48, 48]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.28}
            metalness={0.42}
            normalMap={iceNormal}
          />
        </mesh>
        {/* Frosty Cyan Cryo-Atmosphere Halo */}
        <mesh>
          <sphereGeometry args={[15.6, 32, 32]} />
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 3. Pyros: Volcanic Proto-Planet with Basalt Tectonics */}
      <group
        ref={pyrosRef}
        position={[-300, -140, 340]}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity({
            id: 'planet-pyros',
            name: 'PYROS (VOLCANIC WORLD)',
            type: 'asteroid',
            status: 'ACTIVE MAGMA MANTLE',
            distanceKm: 3100,
            metrics: [
              { label: 'CLASSIFICATION', value: 'VOLCANIC PROTO-PLANET' },
              { label: 'SURFACE TEMP', value: '480', unit: '°C' },
              { label: 'TECTONICS', value: 'EXTREME' },
              { label: 'HEAVY METALS', value: 'ABUNDANT' }
            ],
            actions: [
              { id: 'scan_pyros', label: 'THERMAL SIGNATURE SCAN', variant: 'primary' }
            ]
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredEntity({
            name: 'PYROS (VOLCANIC PROTO-PLANET)',
            type: 'DISTANT CELESTIAL BODY',
            distanceM: 31000,
            actionPrompt: 'CLICK TO TARGET IN SCANNER'
          });
        }}
        onPointerOut={() => setHoveredEntity(null)}
      >
        <mesh>
          <sphereGeometry args={[12, 48, 48]} />
          <meshStandardMaterial
            map={volcanicTex}
            color="#1c1917"
            emissive="#ea580c"
            emissiveIntensity={0.8}
            roughness={0.88}
            metalness={0.2}
          />
        </mesh>
        {/* Thermal Magma Heat Haze Shell */}
        <mesh>
          <sphereGeometry args={[12.6, 32, 32]} />
          <meshBasicMaterial
            color="#f97316"
            transparent
            opacity={0.18}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 4. Gaia Nova: Distant Frontier Colony Planet Limb (Curved Horizon Below) */}
      <group ref={colonyPlanetRef} position={[0, -680, 0]}>
        {/* Colossal Planetary Sphere */}
        <mesh>
          <sphereGeometry args={[480, 64, 64]} />
          <meshStandardMaterial
            map={colonyPlanetTex}
            roughness={0.82}
            metalness={0.12}
          />
        </mesh>
        {/* Rayleigh Atmospheric Cyan Limb Glow */}
        <mesh>
          <sphereGeometry args={[488, 48, 48]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.18}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
};
