import { useRef, useMemo, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

export const WaypointSystem3D: FC = () => {
  const { activeWaypoint, shipPosition, astronautPosition, gameMode, clearWaypoint, addAlert } = useNexusGameStore();
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);

  const isAstronaut = gameMode === 'ASTRONAUT';
  const playerPos = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);

  // Line geometry & line object for route trajectory
  const lineGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  const lineObject = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Line(lineGeom, mat);
  }, [lineGeom]);

  useFrame((state) => {
    if (!activeWaypoint) return;

    const time = state.clock.elapsedTime;

    // Pulse and rotate waypoint beacon
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 1.5;
      ring1Ref.current.rotation.x = time * 0.8;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -time * 1.8;
      ring2Ref.current.rotation.z = -time * 1.0;
    }
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = 2.0 + Math.sin(time * 6.0) * 0.8;
    }

    // Dynamic 3D Trajectory Route Line update
    const curP = isAstronaut ? astronautPosition : shipPosition;
    playerPos.set(curP[0], curP[1], curP[2]);
    targetPos.set(...activeWaypoint.position);

    const posAttr = lineGeom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Start: Player
    arr[0] = playerPos.x;
    arr[1] = playerPos.y;
    arr[2] = playerPos.z;

    // End: Waypoint
    arr[3] = targetPos.x;
    arr[4] = targetPos.y;
    arr[5] = targetPos.z;

    posAttr.needsUpdate = true;

    // Arrival detection: if within 8m, notify and celebrate arrival
    const dist = playerPos.distanceTo(targetPos);
    if (dist < 8.0) {
      addAlert({
        type: 'success',
        title: 'WAYPOINT REACHED',
        message: `Vessel has arrived at destination: ${activeWaypoint.name}.`
      });
      clearWaypoint();
    }
  });

  if (!activeWaypoint) return null;

  const [tx, ty, tz] = activeWaypoint.position;

  return (
    <group>
      {/* Dynamic 3D Route Line */}
      <primitive object={lineObject} />

      {/* Waypoint Target Landmark Structure */}
      <group position={[tx, ty, tz]}>
        {/* Outer Rotating Gyro Ring */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.8, 0.08, 8, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.4}
            wireframe
          />
        </mesh>

        {/* Inner Counter-Rotating Ring */}
        <mesh ref={ring2Ref}>
          <torusGeometry args={[1.8, 0.08, 8, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* Central Core Octahedron */}
        <mesh>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#c084fc"
            emissiveIntensity={2.0}
          />
        </mesh>

        {/* High-Altitude Laser Guide Beam */}
        <mesh position={[0, 40, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 80, 8]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Point Light Illumination */}
        <pointLight ref={beaconLightRef} color="#38bdf8" distance={40} />
      </group>
    </group>
  );
};
