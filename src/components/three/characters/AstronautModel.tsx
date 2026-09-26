import { useRef, useMemo, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFabricWeaveNormal, getBrushedMetalNormal } from '../../../utils/pbrTextureGenerator';

export interface AstronautModelProps {
  animationState?: 'IDLE' | 'WALK' | 'RUN' | 'SCAN' | 'INTERACT' | 'BOARD';
  speed?: number;
  isMoving?: boolean;
  isGrounded?: boolean;
}

export const AstronautModel: FC<AstronautModelProps> = ({
  animationState = 'IDLE',
  speed = 0,
  isMoving = false
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const scanHolobeamRef = useRef<THREE.Mesh>(null);

  // Procedural PBR textures
  const fabricNormal = useMemo(() => getFabricWeaveNormal(), []);
  const metalNormal = useMemo(() => getBrushedMetalNormal(), []);

  // Stride phase for procedural animation
  const stridePhase = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    if (isMoving && speed > 0.1) {
      // Kinematic stride frequency synchronized to speed (zero foot sliding)
      const frequency = animationState === 'RUN' ? 12.0 : 7.0;
      stridePhase.current += dt * frequency;

      const phase = stridePhase.current;
      const legAmplitude = animationState === 'RUN' ? 0.65 : 0.42;
      const armAmplitude = animationState === 'RUN' ? 0.60 : 0.35;

      // Alternating leg swing
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(phase) * legAmplitude;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -Math.sin(phase) * legAmplitude;
      }

      // Opposite arm swing
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(phase) * armAmplitude;
      }
      if (rightArmRef.current && animationState !== 'SCAN' && animationState !== 'INTERACT') {
        rightArmRef.current.rotation.x = Math.sin(phase) * armAmplitude;
      }

      // Subtle torso vertical bounce
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = 0.95 + Math.abs(Math.sin(phase)) * 0.05;
      }
    } else {
      // Idle breathing and resting pose
      stridePhase.current = 0;
      const breath = Math.sin(Date.now() * 0.003) * 0.02;

      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, dt * 8);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, dt * 8);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.05, dt * 6);
      }
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = THREE.MathUtils.lerp(torsoGroupRef.current.position.y, 0.95 + breath, dt * 5);
      }
    }

    // Contextual gestures
    if (animationState === 'SCAN') {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.2, dt * 10);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.4, dt * 10);
      }
      if (scanHolobeamRef.current) {
        scanHolobeamRef.current.visible = true;
      }
    } else if (animationState === 'INTERACT') {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.4, dt * 10);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.1, dt * 10);
      }
      if (scanHolobeamRef.current) scanHolobeamRef.current.visible = false;
    } else {
      if (rightArmRef.current && !isMoving) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.05, dt * 6);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, dt * 6);
      }
      if (scanHolobeamRef.current) scanHolobeamRef.current.visible = false;
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* Torso & Upper Body Group */}
      <group ref={torsoGroupRef} position={[0, 0.95, 0]}>
        {/* Main Pressurized Chest & Torso with realistic EVA fabric weave */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <capsuleGeometry args={[0.26, 0.45, 12, 24]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.65}
            metalness={0.12}
            normalMap={fabricNormal}
          />
        </mesh>

        {/* Chest Life-Support Control Matrix */}
        <mesh position={[0, 0.38, 0.18]}>
          <boxGeometry args={[0.24, 0.22, 0.08]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.88}
            roughness={0.2}
            emissive="#0284c7"
            emissiveIntensity={0.6}
            normalMap={metalNormal}
          />
        </mesh>

        {/* Life-Support Oxygen Backpack */}
        <group position={[0, 0.36, -0.22]}>
          {/* Main pack chassis */}
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.52, 0.18]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.85}
              roughness={0.3}
              normalMap={metalNormal}
            />
          </mesh>
          {/* Dual Oxygen Cylinders */}
          <mesh position={[-0.11, 0, -0.06]}>
            <capsuleGeometry args={[0.07, 0.42, 8, 16]} />
            <meshStandardMaterial
              color="#0284c7"
              metalness={0.92}
              roughness={0.18}
              normalMap={metalNormal}
            />
          </mesh>
          <mesh position={[0.11, 0, -0.06]}>
            <capsuleGeometry args={[0.07, 0.42, 8, 16]} />
            <meshStandardMaterial
              color="#0284c7"
              metalness={0.92}
              roughness={0.18}
              normalMap={metalNormal}
            />
          </mesh>
          {/* Backpack status LED bar */}
          <mesh position={[0, 0.22, -0.1]}>
            <boxGeometry args={[0.2, 0.03, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        {/* Helmet & Visor */}
        <group position={[0, 0.76, 0]}>
          {/* Outer Helmet Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.24, 32, 32]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.25}
              metalness={0.3}
              normalMap={metalNormal}
            />
          </mesh>
          {/* Gold Reflective Bubble Visor with MeshPhysicalMaterial clearcoat */}
          <mesh position={[0, 0.02, 0.12]}>
            <sphereGeometry args={[0.18, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshPhysicalMaterial
              color="#f59e0b"
              metalness={0.98}
              roughness={0.04}
              emissive="#b45309"
              emissiveIntensity={0.2}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              reflectivity={1.0}
            />
          </mesh>
          {/* Helmet Spotlight */}
          <pointLight position={[0, 0.1, 0.35]} color="#f0f9ff" intensity={1.2} distance={12} />
        </group>

        {/* Left Arm Hierarchy */}
        <group ref={leftArmRef} position={[-0.35, 0.52, 0]}>
          {/* Shoulder Pad */}
          <mesh castShadow>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} normalMap={metalNormal} />
          </mesh>
          {/* Arm Sleeve */}
          <mesh castShadow position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.08, 0.32, 8, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.12} normalMap={fabricNormal} />
          </mesh>
          {/* Utility Glove */}
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[0.09, 0.12, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>

        {/* Right Arm Hierarchy (equipped with Omnitool Scanner) */}
        <group ref={rightArmRef} position={[0.35, 0.52, 0]}>
          {/* Shoulder Pad */}
          <mesh castShadow>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} normalMap={metalNormal} />
          </mesh>
          {/* Arm Sleeve */}
          <mesh castShadow position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.08, 0.32, 8, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.12} normalMap={fabricNormal} />
          </mesh>
          {/* Forearm Scanner Module */}
          <mesh position={[0, -0.32, 0.06]}>
            <boxGeometry args={[0.08, 0.14, 0.06]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#38bdf8"
              emissiveIntensity={0.85}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Utility Glove */}
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[0.09, 0.12, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Holographic Scanning Cone */}
          <mesh
            ref={scanHolobeamRef}
            visible={false}
            position={[0, -0.45, 1.8]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[0.9, 3.2, 16, 1, true]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.35}
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>

      {/* Left Leg Hierarchy */}
      <group ref={leftLegRef} position={[-0.17, 0.95, 0]}>
        <mesh castShadow position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.11, 0.55, 8, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.12} normalMap={fabricNormal} />
        </mesh>
        {/* Reinforced Knee Guard */}
        <mesh position={[0, -0.35, 0.1]}>
          <boxGeometry args={[0.13, 0.14, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} normalMap={metalNormal} />
        </mesh>
        {/* Magnetic Surface Boot */}
        <mesh position={[0, -0.78, 0.06]} castShadow>
          <boxGeometry args={[0.15, 0.16, 0.32]} />
          <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.35} normalMap={metalNormal} />
        </mesh>
      </group>

      {/* Right Leg Hierarchy */}
      <group ref={rightLegRef} position={[0.17, 0.95, 0]}>
        <mesh castShadow position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.11, 0.55, 8, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.12} normalMap={fabricNormal} />
        </mesh>
        {/* Reinforced Knee Guard */}
        <mesh position={[0, -0.35, 0.1]}>
          <boxGeometry args={[0.13, 0.14, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} normalMap={metalNormal} />
        </mesh>
        {/* Magnetic Surface Boot */}
        <mesh position={[0, -0.78, 0.06]} castShadow>
          <boxGeometry args={[0.15, 0.16, 0.32]} />
          <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.35} normalMap={metalNormal} />
        </mesh>
      </group>
    </group>
  );
};
