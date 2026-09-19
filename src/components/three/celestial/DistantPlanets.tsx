import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const DistantPlanets: FC = () => {
  const gorgonRef = useRef<THREE.Group>(null);
  const boreasRef = useRef<THREE.Group>(null);
  const pyrosRef = useRef<THREE.Group>(null);

  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  useFrame((_, delta) => {
    if (gorgonRef.current) gorgonRef.current.rotation.y += delta * 0.02;
    if (boreasRef.current) boreasRef.current.rotation.y += delta * 0.015;
    if (pyrosRef.current) pyrosRef.current.rotation.y += delta * 0.025;
  });

  return (
    <group>
      {/* 1. Gorgon: Ringed Gas Giant */}
      <group
        ref={gorgonRef}
        position={[-360, 120, -280]}
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
        <mesh>
          <sphereGeometry args={[18, 32, 32]} />
          <meshStandardMaterial
            color="#b45309"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        {/* Concentric Planetary Rings */}
        <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[23, 34, 48]} />
          <meshStandardMaterial
            color="#d97706"
            roughness={0.8}
            metalness={0.2}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* 2. Boreas: Glacial Ice World */}
      <group
        ref={boreasRef}
        position={[320, -110, -260]}
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
          <sphereGeometry args={[11, 32, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* 3. Pyros: Volcanic Planet with Basalt Rifts */}
      <group
        ref={pyrosRef}
        position={[-280, -140, 320]}
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
          <sphereGeometry args={[8.5, 32, 32]} />
          <meshStandardMaterial
            color="#18181b"
            emissive="#ea580c"
            emissiveIntensity={0.6}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
};
