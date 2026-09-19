import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VISUAL_THEME } from '../../../config/visualTheme';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

interface AsteroidItemProps {
  id: string;
  name: string;
  type: 'iron' | 'titanium' | 'ice' | 'uranium' | 'rare';
  position: [number, number, number];
  scale: number;
  rotationSpeed: [number, number, number];
}

const AsteroidItem: FC<AsteroidItemProps> = ({
  id,
  name,
  type,
  position,
  scale,
  rotationSpeed
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selectEntity, setHoveredEntity } = useNexusGameStore();
  const resTheme = VISUAL_THEME.resources[type];

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed[0] * delta;
      meshRef.current.rotation.y += rotationSpeed[1] * delta;
      meshRef.current.rotation.z += rotationSpeed[2] * delta;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectEntity({
      id,
      name,
      type: 'asteroid',
      status: 'MINABLE',
      metrics: [
        { label: 'RESOURCE', value: resTheme.name.toUpperCase() },
        { label: 'EST. YIELD', value: Math.round(scale * 420), unit: 'MT' },
        { label: 'PURITY', value: (88 + scale * 4).toFixed(1), unit: '%' }
      ],
      actions: [
        { id: 'scan', label: 'DEEP SPECTRAL SCAN', variant: 'primary' },
        { id: 'mine', label: 'DEPLOY MINING BEAM', variant: 'secondary' }
      ]
    });
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, scale]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredEntity({
          name,
          type: resTheme.name.toUpperCase(),
          distanceM: Math.round(position[0] * 12 + 150),
          actionPrompt: 'CLICK TO TARGET / [E] TO SCAN'
        });
      }}
      onPointerOut={() => setHoveredEntity(null)}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={resTheme.color}
        roughness={resTheme.roughness}
        metalness={resTheme.metalness}
        emissive={'emissive' in resTheme ? (resTheme as { emissive: string }).emissive : undefined}
        emissiveIntensity={'emissiveIntensity' in resTheme ? (resTheme as { emissiveIntensity: number }).emissiveIntensity : 0}
      />
    </mesh>
  );
};

export const AsteroidField: FC = () => {
  const asteroidData: AsteroidItemProps[] = [
    { id: 'ast-01', name: 'TITANIUM ASTEROID-047', type: 'titanium', position: [14, 6, -18], scale: 2.2, rotationSpeed: [0.1, 0.2, 0.05] },
    { id: 'ast-02', name: 'METALLIC IRON VEIN-012', type: 'iron', position: [-22, 12, -28], scale: 3.0, rotationSpeed: [0.05, 0.1, 0.15] },
    { id: 'ast-03', name: 'GLACIAL ICE COMET-88', type: 'ice', position: [28, 16, 24], scale: 2.6, rotationSpeed: [0.15, 0.05, 0.1] },
    { id: 'ast-04', name: 'URANIUM DEPOSIT-94', type: 'uranium', position: [-34, 8, 20], scale: 2.0, rotationSpeed: [0.2, 0.1, 0.05] },
    { id: 'ast-05', name: 'RARE CRYSTAL CLUSTER-03', type: 'rare', position: [38, 22, -32], scale: 1.8, rotationSpeed: [0.08, 0.18, 0.12] },
    { id: 'ast-06', name: 'IRON BOULDER-21', type: 'iron', position: [-12, -4, -40], scale: 3.5, rotationSpeed: [0.04, 0.08, 0.04] },
    { id: 'ast-07', name: 'DEEP ICE FRAGMENT-14', type: 'ice', position: [18, 5, 38], scale: 2.4, rotationSpeed: [0.12, 0.14, 0.08] }
  ];

  return (
    <group>
      {asteroidData.map((ast) => (
        <AsteroidItem key={ast.id} {...ast} />
      ))}
    </group>
  );
};
