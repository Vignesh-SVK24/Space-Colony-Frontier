import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const SurfacePOIs: FC = () => {
  const { planetaryPOIs, astronautPosition, interactWithPOI } = useNexusGameStore();
  const monolithCoreRef = useRef<THREE.Mesh>(null);
  const terminalRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (monolithCoreRef.current) {
      monolithCoreRef.current.rotation.y = time * 0.8;
      monolithCoreRef.current.position.y = 2.8 + Math.sin(time * 2.0) * 0.25;
    }
    if (terminalRingRef.current) {
      terminalRingRef.current.rotation.z = time * 1.2;
    }
  });

  return (
    <group>
      {planetaryPOIs.map((poi) => {
        const [px, py, pz] = poi.position;
        const distToAstro = Math.hypot(astronautPosition[0] - px, astronautPosition[2] - pz);
        const isNearby = distToAstro < 5.0;

        return (
          <group
            key={poi.id}
            position={[px, py, pz]}
            onClick={(e) => {
              e.stopPropagation();
              if (isNearby) interactWithPOI(poi.id);
            }}
          >
            {poi.type === 'terminal' && (
              <group>
                <mesh position={[0, 0.8, 0]} castShadow>
                  <cylinderGeometry args={[0.5, 0.7, 1.6, 8]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 1.7, 0]} rotation={[0.4, 0, 0]}>
                  <boxGeometry args={[0.9, 0.6, 0.1]} />
                  <meshStandardMaterial
                    color="#0284c7"
                    emissive="#38bdf8"
                    emissiveIntensity={poi.interacted ? 0.3 : 1.2}
                  />
                </mesh>
                <mesh ref={terminalRingRef} position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.6, 0.7, 16]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}

            {poi.type === 'monolith' && (
              <group>
                <mesh position={[0, 4, 0]} castShadow>
                  <boxGeometry args={[1.4, 8.0, 1.4]} />
                  <meshStandardMaterial
                    color="#0f172a"
                    metalness={0.9}
                    roughness={0.15}
                    emissive="#7c3aed"
                    emissiveIntensity={0.25}
                  />
                </mesh>
                <mesh ref={monolithCoreRef} position={[0, 2.8, 0]}>
                  <octahedronGeometry args={[0.7, 0]} />
                  <meshStandardMaterial
                    color="#c084fc"
                    emissive="#a855f7"
                    emissiveIntensity={1.8}
                    wireframe
                  />
                </mesh>
              </group>
            )}

            {poi.type === 'mineral' && (
              <group>
                {[
                  [-0.4, 0.8, 0, 0.3, 0.2, 0.5],
                  [0.3, 1.1, 0.2, -0.4, 0.1, -0.3],
                  [0, 1.4, -0.2, 0.1, -0.3, 0.2]
                ].map(([cx, cy, cz, rx, ry, rz], idx) => (
                  <mesh key={idx} position={[cx, cy, cz]} rotation={[rx, ry, rz]} castShadow>
                    <coneGeometry args={[0.4, 2.0, 5]} />
                    <meshStandardMaterial
                      color="#0284c7"
                      metalness={0.95}
                      roughness={0.1}
                      emissive="#38bdf8"
                      emissiveIntensity={poi.interacted ? 0.2 : 0.8}
                    />
                  </mesh>
                ))}
              </group>
            )}

            {poi.type === 'oxygen_station' && (
              <group>
                <mesh position={[0, 1.3, 0]} castShadow>
                  <capsuleGeometry args={[0.6, 1.4, 8, 16]} />
                  <meshStandardMaterial
                    color="#0284c7"
                    roughness={0.3}
                    metalness={0.7}
                    emissive="#0284c7"
                    emissiveIntensity={0.4}
                  />
                </mesh>
                <pointLight position={[0, 2.4, 0]} color="#38bdf8" intensity={1.5} distance={10} />
              </group>
            )}

            {poi.type === 'drone' && (
              <group position={[0, 0.5, 0]} rotation={[0.3, 0.8, -0.2]}>
                <mesh castShadow>
                  <boxGeometry args={[1.8, 0.6, 2.2]} />
                  <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.5, 0]}>
                  <sphereGeometry args={[0.2, 8, 8]} />
                  <meshBasicMaterial color="#f97316" />
                </mesh>
              </group>
            )}

            {isNearby && (
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.0, 2.3, 24]} />
                <meshBasicMaterial
                  color={poi.interacted ? '#64748b' : '#38bdf8'}
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
