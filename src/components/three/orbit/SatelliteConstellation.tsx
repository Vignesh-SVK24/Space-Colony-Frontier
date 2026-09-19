import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

interface SatelliteData {
  id: string;
  name: string;
  type: string;
  radius: number;
  speed: number;
  inclination: number;
  phase: number;
}

const SATELLITES: SatelliteData[] = [
  { id: 'sat-nav-01', name: 'NAV-SAT 01 (GPS RELAY)', type: 'NAVIGATION', radius: 45, speed: 0.12, inclination: 0.2, phase: 0 },
  { id: 'sat-nav-02', name: 'NAV-SAT 02 (ORBITAL TRACKER)', type: 'NAVIGATION', radius: 48, speed: 0.11, inclination: -0.3, phase: Math.PI },
  { id: 'sat-comms-alpha', name: 'COMMS RELAY ALPHA', type: 'COMMUNICATION', radius: 56, speed: 0.08, inclination: 0.45, phase: 1.2 },
  { id: 'sat-comms-beta', name: 'COMMS RELAY BETA', type: 'COMMUNICATION', radius: 58, speed: 0.075, inclination: -0.4, phase: 4.5 },
  { id: 'sat-surveyor', name: 'AETHELIA RESOURCE SURVEYOR', type: 'SPECTROMETRY', radius: 66, speed: 0.06, inclination: 0.6, phase: 2.8 },
  { id: 'sat-weather', name: 'SOLAR WEATHER SENTINEL', type: 'SPACE WEATHER', radius: 74, speed: 0.05, inclination: -0.15, phase: 5.2 }
];

export const SatelliteConstellation: FC = () => {
  const groupsRef = useRef<(THREE.Group | null)[]>([]);
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    SATELLITES.forEach((sat, idx) => {
      const grp = groupsRef.current[idx];
      if (grp) {
        const angle = sat.phase + t * sat.speed;
        const x = Math.cos(angle) * sat.radius;
        const z = Math.sin(angle) * sat.radius;
        const y = Math.sin(angle * 2) * (sat.radius * sat.inclination);
        grp.position.set(x, y + 25, z);
        grp.rotation.y = angle + Math.PI / 2;
      }
    });
  });

  return (
    <group>
      {SATELLITES.map((sat, idx) => (
        <group
          key={sat.id}
          ref={(el) => (groupsRef.current[idx] = el)}
          onClick={(e) => {
            e.stopPropagation();
            selectEntity({
              id: sat.id,
              name: sat.name,
              type: 'spacecraft',
              status: 'ORBITAL TELEMETRY OPTIMAL',
              distanceKm: Math.round(sat.radius * 2),
              metrics: [
                { label: 'ORBITAL RADIUS', value: sat.radius, unit: 'KM' },
                { label: 'SIGNAL STRENGTH', value: '99.4', unit: '%' },
                { label: 'BATTERY RESERVE', value: '98', unit: '%' },
                { label: 'SUBSYSTEM', value: sat.type }
              ],
              actions: [
                { id: 'ping_sat', label: 'PING TRANSPONDER', variant: 'primary' },
                { id: 'recalibrate', label: 'RECALIBRATE ATTITUDE', variant: 'secondary' }
              ]
            });
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredEntity({
              name: sat.name,
              type: 'ORBITAL SATELLITE',
              distanceM: Math.round(sat.radius * 25),
              actionPrompt: 'CLICK TO INSPECT ORBITAL SATELLITE'
            });
          }}
          onPointerOut={() => setHoveredEntity(null)}
        >
          {/* Central Satellite Body Bus */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.8, 1.2]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Left Solar Panel Array */}
          <mesh position={[-1.4, 0, 0]}>
            <boxGeometry args={[1.6, 0.05, 0.8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Right Solar Panel Array */}
          <mesh position={[1.4, 0, 0]}>
            <boxGeometry args={[1.6, 0.05, 0.8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* High-Gain Antenna Dish */}
          <mesh position={[0, 0.5, 0.5]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.05, 0.2, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Pulsing Beacon Light */}
          <pointLight color="#38bdf8" intensity={0.8} distance={8} />
        </group>
      ))}
    </group>
  );
};
