import { useRef, type FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function RotatingBeacon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.x += delta * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.6;
    }
  });

  return (
    <group position={[0, 1.5, 0]}>
      {/* Central Core */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.2}
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={0.6}
          wireframe={false}
        />
      </mesh>

      {/* Orbiting Quantum Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Ground Landing Pad Mockup */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4.2, 0.2, 8]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

export const SceneRoot: FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 4, 8], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color('#030712'));
          scene.fog = new THREE.FogExp2('#030712', 0.02);
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 20, 15]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 2, 0]} intensity={2} color="#38bdf8" distance={10} />

        <Stars
          radius={120}
          depth={50}
          count={5000}
          factor={4}
          saturation={0.5}
          fade
          speed={1}
        />

        <gridHelper args={[30, 30, '#0284c7', '#1e293b']} position={[0, -0.1, 0]} />

        <RotatingBeacon />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
};
