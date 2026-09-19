import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

interface AiShip {
  id: string;
  name: string;
  type: string;
  faction: 'civilian' | 'mining' | 'colony';
  speed: number;
  routeRadius: number;
  yOffset: number;
  phase: number;
  task: string;
}

const AI_SHIPS: AiShip[] = [
  { id: 'cargo-701', name: 'FREIGHTER ATLAS-701', type: 'HEAVY CARGO HAULER', faction: 'civilian', speed: 0.08, routeRadius: 85, yOffset: 38, phase: 0.5, task: 'ORBITAL DEPOT TRANSIT' },
  { id: 'miner-04', name: 'EXCAVATOR TAURUS-4', type: 'AUTOMATED MINING BARGE', faction: 'mining', speed: 0.06, routeRadius: 115, yOffset: 12, phase: 2.1, task: 'ORE EXTRACTION CYCLE' },
  { id: 'recon-09', name: 'SHUTTLE ORION-9', type: 'LIGHT RECON VESSEL', faction: 'colony', speed: 0.12, routeRadius: 65, yOffset: 28, phase: 4.0, task: 'PERIMETER PATROL' }
];

export const CivilianTrafficManager: FC = () => {
  const shipRefs = useRef<(THREE.Group | null)[]>([]);
  const { selectEntity, setHoveredEntity } = useNexusGameStore();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    AI_SHIPS.forEach((ship, idx) => {
      const grp = shipRefs.current[idx];
      if (grp) {
        const angle = ship.phase + t * ship.speed;
        const x = Math.cos(angle) * ship.routeRadius;
        const z = Math.sin(angle) * ship.routeRadius;
        const y = ship.yOffset + Math.sin(angle * 3) * 6;

        grp.position.set(x, y, z);

        // Orient facing forward along tangent
        const tangentX = -Math.sin(angle);
        const tangentZ = Math.cos(angle);
        grp.rotation.y = Math.atan2(tangentX, tangentZ) + Math.PI;
      }
    });
  });

  return (
    <group>
      {AI_SHIPS.map((ship, idx) => (
        <group
          key={ship.id}
          ref={(el) => (shipRefs.current[idx] = el)}
          onClick={(e) => {
            e.stopPropagation();
            selectEntity({
              id: ship.id,
              name: ship.name,
              type: 'spacecraft',
              status: 'CIVILIAN TRAFFIC CLEARANCE',
              distanceKm: Math.round(ship.routeRadius * 1.5),
              metrics: [
                { label: 'CLASSIFICATION', value: ship.type },
                { label: 'FACTION', value: ship.faction.toUpperCase() },
                { label: 'STATUS', value: ship.task },
                { label: 'VELOCITY', value: (ship.speed * 420).toFixed(1), unit: 'M/S' }
              ],
              actions: [
                { id: 'hail_ship', label: 'HAIL TRANSPONDER CHANNEL', variant: 'primary' },
                { id: 'scan_cargo', label: 'MANIFEST CARGO INSPECTION', variant: 'secondary' }
              ]
            });
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredEntity({
              name: ship.name,
              type: ship.type,
              distanceM: Math.round(ship.routeRadius * 15),
              actionPrompt: 'PRESS [E] TO SCAN CIVILIAN VESSEL'
            });
          }}
          onPointerOut={() => setHoveredEntity(null)}
        >
          {/* Main Ship Hull */}
          <mesh castShadow>
            <boxGeometry args={[1.6, 1.0, 4.2]} />
            <meshStandardMaterial
              color={ship.faction === 'mining' ? '#d97706' : '#64748b'}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Forward Cockpit Canopy */}
          <mesh position={[0, 0.4, -1.5]}>
            <boxGeometry args={[1.2, 0.6, 1.2]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>

          {/* Twin Sub-light Engine Glow */}
          <mesh position={[-0.5, 0, 2.2]}>
            <cylinderGeometry args={[0.3, 0.35, 0.4, 8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0.5, 0, 2.2]}>
            <cylinderGeometry args={[0.3, 0.35, 0.4, 8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>

          {/* Engine Exhaust Light */}
          <pointLight position={[0, 0, 2.8]} color="#38bdf8" intensity={1.5} distance={10} />
        </group>
      ))}
    </group>
  );
};
