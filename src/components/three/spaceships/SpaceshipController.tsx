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
  const dustRef = useRef<THREE.Points>(null);
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
    gameMode,
    initiateLandingSequence,
    completeTouchdown,
    finishTakeoff,
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

      if (k === 'E' && gameMode === 'SPACE_FLIGHT') {
        const ship = shipGroupRef.current;
        if (ship) {
          const padDist = ship.position.distanceTo(new THREE.Vector3(0, -1.5, 0));
          if (padDist < 45) {
            initiateLandingSequence();
          }
        }
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
  }, [cameraMode, addAlert, gameMode, initiateLandingSequence]);

  useFrame((state, delta) => {
    const ship = shipGroupRef.current;
    if (!ship) return;

    const dt = Math.min(delta, 0.1);

    // ==========================================
    // 1. AUTOMATED DESCENT & LANDING SEQUENCE
    // ==========================================
    if (gameMode === 'DESCENDING') {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, 0, dt * 2.5);
      currentThrottle.current = 0.35; // Retro-thrusters firing

      // Align attitude to horizontal
      shipEuler.current.x = THREE.MathUtils.lerp(shipEuler.current.x, 0, dt * 3.0);
      shipEuler.current.z = THREE.MathUtils.lerp(shipEuler.current.z, 0, dt * 3.0);
      ship.rotation.copy(shipEuler.current);

      // Glide down smoothly to landing pad [0, -0.2, 0]
      ship.position.x = THREE.MathUtils.lerp(ship.position.x, 0, dt * 1.8);
      ship.position.z = THREE.MathUtils.lerp(ship.position.z, 0, dt * 1.8);
      ship.position.y = THREE.MathUtils.lerp(ship.position.y, -0.2, dt * 1.5);

      // Landing dust plume
      if (dustRef.current) {
        dustRef.current.visible = true;
        dustRef.current.rotation.y += dt * 3.0;
      }

      // Touchdown complete check
      if (ship.position.y <= -0.1 && Math.abs(ship.position.x) < 0.8 && Math.abs(ship.position.z) < 0.8) {
        ship.position.set(0, -0.2, 0);
        currentThrottle.current = 0;
        if (dustRef.current) dustRef.current.visible = false;
        completeTouchdown();
      }

      // Camera follow during descent
      const camTarget = ship.position.clone().add(new THREE.Vector3(0, 3.5, -9.0));
      camera.position.lerp(camTarget, dt * 4.0);
      camera.lookAt(ship.position.clone().add(new THREE.Vector3(0, 0.5, 2.0)));
      return;
    }

    // ==========================================
    // 2. AUTOMATED TAKEOFF & ASCENT SEQUENCE
    // ==========================================
    if (gameMode === 'TAKEOFF') {
      currentThrottle.current = 1.0;
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, 12, dt * 3);

      // Vertical climb
      ship.position.y += dt * 7.5;
      shipEuler.current.x = THREE.MathUtils.lerp(shipEuler.current.x, 0.35, dt * 2.0); // Slight nose up
      ship.rotation.copy(shipEuler.current);

      if (dustRef.current) {
        dustRef.current.visible = ship.position.y < 8;
        dustRef.current.rotation.y += dt * 5.0;
      }

      // Reached safe altitude -> restore orbital flight
      if (ship.position.y >= 14) {
        if (dustRef.current) dustRef.current.visible = false;
        finishTakeoff();
      }

      // Camera follow during takeoff
      const camTarget = ship.position.clone().add(new THREE.Vector3(0, 4.0, -12.0));
      camera.position.lerp(camTarget, dt * 5.0);
      camera.lookAt(ship.position.clone().add(new THREE.Vector3(0, 1.0, 10.0)));
      return;
    }

    // Hide dust outside landing/takeoff
    if (dustRef.current) dustRef.current.visible = false;

    // Only process manual flight controls when in SPACE_FLIGHT or ORBIT
    if (gameMode !== 'SPACE_FLIGHT' && gameMode !== 'ORBIT') {
      return;
    }

    // ==========================================
    // 3. 6-DOF MANUAL SPACESHIP FLIGHT
    // ==========================================
    const k = keys.current;
    const forwardInput = (k['W'] || k['KeyW']) ? 1 : (k['S'] || k['KeyS']) ? -0.8 : 0;
    const yawInput = (k['A'] || k['KeyA']) ? 1 : (k['D'] || k['KeyD']) ? -1 : 0;
    const rollInput = (k['Q'] || k['KeyQ']) ? 1 : (k['E'] || k['KeyE']) ? -1 : 0;
    const pitchInput = (k['R'] || k['KeyR']) ? 1 : (k['F'] || k['KeyF']) ? -1 : 0;
    const boostInput = (k['ShiftLeft'] || k['ShiftRight'] || k['Shift']) && forwardInput > 0;
    const brakeInput = (k['Space'] || k[' ']);

    isBoostingRef.current = !!boostInput;
    isBrakingRef.current = !!brakeInput;

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
      currentSpeed.current *= Math.pow(SHIP_CONFIG.dampingLinear, dt * 60);
      currentThrottle.current = THREE.MathUtils.lerp(currentThrottle.current, 0, dt * 3);
    }

    const yawDelta = yawInput * SHIP_CONFIG.yawSpeed * dt;
    shipEuler.current.y += yawDelta;

    const targetBank = yawInput * SHIP_CONFIG.bankFactor + rollInput * 0.8;
    bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, dt * 6.0);
    shipEuler.current.z = bankAngle.current;

    pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, pitchInput * 0.5, dt * 5.0);
    shipEuler.current.x = pitchAngle.current;

    ship.rotation.copy(shipEuler.current);

    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(shipEuler.current);
    velocity.current.copy(forwardDir).multiplyScalar(currentSpeed.current);
    ship.position.addScaledVector(velocity.current, dt);

    // Boundary clamp
    const distFromOrigin = ship.position.length();
    if (distFromOrigin > 350) {
      ship.position.clampLength(0, 349);
      currentSpeed.current *= 0.5;
    }

    // Landing zone detection on Aethelia-IV primary pad
    const pos = ship.position;
    const padDist = pos.distanceTo(new THREE.Vector3(0, -1.5, 0));
    if (padDist < 45) {
      setHoveredEntity({
        name: 'AETHELIA-IV PRIMARY PAD',
        type: 'COLONY LANDING ZONE',
        distanceM: Math.round(padDist * 10),
        actionPrompt: 'SURFACE STABLE // PRESS [E] TO INITIATE DESCENT'
      });
    } else {
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

    // Dynamic camera follow
    if (cameraMode === 0) {
      const cameraOffset = new THREE.Vector3(0, SHIP_CONFIG.camera.chaseHeight, -SHIP_CONFIG.camera.chaseDistance);
      if (boostInput) cameraOffset.z -= 2.0;
      cameraOffset.applyEuler(shipEuler.current);

      const targetCamPos = ship.position.clone().add(cameraOffset);
      camera.position.lerp(targetCamPos, SHIP_CONFIG.camera.chaseLag * (dt * 60));

      const lookTarget = ship.position.clone().add(forwardDir.clone().multiplyScalar(15));
      camera.lookAt(lookTarget);

      const targetFov = 55 + (currentSpeed.current / SHIP_CONFIG.boostSpeed) * SHIP_CONFIG.camera.boostFovKick;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 6);
        camera.updateProjectionMatrix();
      }
    } else {
      const cockpitOffset = new THREE.Vector3(...SHIP_CONFIG.camera.cockpitOffset).applyEuler(shipEuler.current);
      camera.position.copy(ship.position).add(cockpitOffset);
      const lookTarget = ship.position.clone().add(forwardDir.clone().multiplyScalar(40));
      camera.lookAt(lookTarget);
    }

    // UI telemetry
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

      {/* Thruster Ground Dust Plume Ring */}
      <points ref={dustRef} visible={false} position={[0, -0.8, 0]}>
        <ringGeometry args={[1.5, 4.5, 32]} />
        <pointsMaterial
          size={0.4}
          color="#38bdf8"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
