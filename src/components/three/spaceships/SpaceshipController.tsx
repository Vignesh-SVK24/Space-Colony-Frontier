import { useRef, useEffect, useState, type FC } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SHIP_CONFIG } from '../../../config/shipConfig';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { SpaceshipModel } from './SpaceshipModel';
import { nexusAudio } from '../../../utils/nexusAudio';

export interface SpaceshipControllerProps {
  initialPosition?: [number, number, number];
}

export const SpaceshipController: FC<SpaceshipControllerProps> = ({
  initialPosition = [0, 8, 12]
}) => {
  const shipGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Flight Kinematics
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const currentSpeed = useRef(0);
  const currentThrottle = useRef(0);
  const isBoostingRef = useRef(false);
  const isBrakingRef = useRef(false);

  // Rotation Euler / Quaternion
  const shipEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const bankAngle = useRef(0);
  const pitchAngle = useRef(0);

  // Camera Mode: 0 = Chase, 1 = Cockpit
  const [cameraMode, setCameraMode] = useState<0 | 1>(0);

  // Key tracking state
  const keys = useRef<Record<string, boolean>>({});
  const lastTelemetryTime = useRef(0);

  const {
    setHoveredEntity,
    addAlert,
    setFlightTelemetry,
    setShipPosition
  } = useNexusGameStore();

  // Desktop keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toUpperCase();
      keys.current[k] = true;
      keys.current[e.code] = true;

      if (k === 'V') {
        nexusAudio.playClick(1300);
        setCameraMode((prev) => (prev === 0 ? 1 : 0));
        addAlert({
          type: 'info',
          title: 'CAMERA MODE TOGGLED',
          message: cameraMode === 0 ? 'Cockpit Forward View engaged.' : 'Orbital Chase Camera engaged.'
        });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      keys.current[k] = false;
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [cameraMode, addAlert]);

  useFrame((state, delta) => {
    const ship = shipGroupRef.current;
    if (!ship) return;

    const dt = Math.min(delta, 0.1); // Clamp to prevent delta spikes

    const k = keys.current;
    const forwardInput = (k['W'] || k['KeyW']) ? 1 : (k['S'] || k['KeyS']) ? -0.8 : 0;
    const yawInput = (k['A'] || k['KeyA']) ? 1 : (k['D'] || k['KeyD']) ? -1 : 0;
    const rollInput = (k['Q'] || k['KeyQ']) ? 1 : (k['E'] || k['KeyE']) ? -1 : 0;
    const pitchInput = (k['R'] || k['KeyR']) ? 1 : (k['F'] || k['KeyF']) ? -1 : 0;
    const boostInput = (k['ShiftLeft'] || k['ShiftRight'] || k['Shift']) && forwardInput > 0;
    const brakeInput = (k['Space'] || k[' ']);

    isBoostingRef.current = !!boostInput;
    isBrakingRef.current = !!brakeInput;

    // 1. Acceleration / Throttle
    const targetMaxSpeed = boostInput ? SHIP_CONFIG.boostSpeed : SHIP_CONFIG.maxSpeed;

    if (forwardInput > 0) {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetMaxSpeed, dt * (boostInput ? 3.5 : 2.0));
      currentThrottle.current = THREE.MathUtils.lerp(currentThrottle.current, boostInput ? 1.0 : 0.7, dt * 4);
    } else if (forwardInput < 0) {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, SHIP_CONFIG.minSpeed, dt * 2.5);
      currentThrottle.current = 0;
    } else if (brakeInput) {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, 0, dt * 5.0);
      currentThrottle.current = 0;
    } else {
      // Natural inertial glide damping
      currentSpeed.current *= Math.pow(SHIP_CONFIG.dampingLinear, dt * 60);
      currentThrottle.current = THREE.MathUtils.lerp(currentThrottle.current, 0, dt * 3);
    }

    // 2. Yaw & Natural Banking
    const yawDelta = yawInput * SHIP_CONFIG.yawSpeed * dt;
    shipEuler.current.y += yawDelta;

    // Smooth banking roll during yaw turns (rolling into turn)
    const targetBank = yawInput * SHIP_CONFIG.bankFactor + rollInput * 0.8;
    bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, dt * 6.0);
    shipEuler.current.z = bankAngle.current;

    // 3. Pitch
    pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, pitchInput * 0.5, dt * 5.0);
    shipEuler.current.x = pitchAngle.current;

    // Apply rotation to ship
    ship.rotation.copy(shipEuler.current);

    // 4. Directional Forward Translation
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(shipEuler.current);
    velocity.current.copy(forwardDir).multiplyScalar(currentSpeed.current);
    ship.position.addScaledVector(velocity.current, dt);

    // 5. Collision & Boundaries
    // Boundary clamp: keep within outer perimeter
    const distFromOrigin = ship.position.length();
    if (distFromOrigin > 350) {
      ship.position.clampLength(0, 349);
      currentSpeed.current *= 0.5;
    }

    // 6. Proximity Interaction Check (Asteroids & Landing Pad)
    const pos = ship.position;
    // Check distance to landing pad (at [0, -1.5, 0])
    const padDist = pos.distanceTo(new THREE.Vector3(0, -1.5, 0));
    if (padDist < SHIP_CONFIG.interaction.colonyLandDistance) {
      setHoveredEntity({
        name: 'OUTPOST ALPHA LANDING BERTH',
        type: 'COLONY LANDING DOCK',
        distanceM: Math.round(padDist * 10),
        actionPrompt: 'PRESS [SPACE] TO HOVER / [E] TO LAND'
      });
    } else {
      // Check distance to asteroid at [8, 3, -6]
      const astDist = pos.distanceTo(new THREE.Vector3(8, 3, -6));
      if (astDist < SHIP_CONFIG.interaction.asteroidScanDistance) {
        setHoveredEntity({
          name: 'TITANIUM ASTEROID-047',
          type: 'MINABLE ASTEROID',
          distanceM: Math.round(astDist * 15),
          actionPrompt: 'PRESS [E] TO SCAN / MINE'
        });
      }
    }

    // 7. Dynamic Camera Follow
    if (cameraMode === 0) {
      // Third-person chase camera
      const cameraOffset = new THREE.Vector3(0, SHIP_CONFIG.camera.chaseHeight, -SHIP_CONFIG.camera.chaseDistance);
      if (boostInput) {
        cameraOffset.z -= 2.0; // Camera pulls back on boost
      }
      cameraOffset.applyEuler(shipEuler.current);

      const targetCamPos = ship.position.clone().add(cameraOffset);
      camera.position.lerp(targetCamPos, SHIP_CONFIG.camera.chaseLag * (dt * 60));

      // Look slightly ahead of the ship
      const lookTarget = ship.position.clone().add(forwardDir.clone().multiplyScalar(15));
      camera.lookAt(lookTarget);

      // Speed FOV Kick
      const targetFov = 55 + (currentSpeed.current / SHIP_CONFIG.boostSpeed) * SHIP_CONFIG.camera.boostFovKick;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 6);
        camera.updateProjectionMatrix();
      }
    } else {
      // First-person cockpit mode
      const cockpitOffset = new THREE.Vector3(...SHIP_CONFIG.camera.cockpitOffset).applyEuler(shipEuler.current);
      camera.position.copy(ship.position).add(cockpitOffset);
      const lookTarget = ship.position.clone().add(forwardDir.clone().multiplyScalar(40));
      camera.lookAt(lookTarget);
    }

    // 8. Throttled UI Telemetry Sync
    if (state.clock.elapsedTime - lastTelemetryTime.current > 0.1) {
      lastTelemetryTime.current = state.clock.elapsedTime;
      setFlightTelemetry({
        speed: currentSpeed.current,
        isBoosting: !!boostInput,
        isBraking: !!brakeInput
      });
      setShipPosition([ship.position.x, ship.position.y, ship.position.z]);
    }
  });

  return (
    <group ref={shipGroupRef} position={initialPosition}>
      <SpaceshipModel
        throttle={currentThrottle.current}
        isBoosting={isBoostingRef.current}
        paintScheme="default"
      />
    </group>
  );
};
