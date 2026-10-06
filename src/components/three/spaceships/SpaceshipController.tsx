import { useRef, useEffect, useState, type FC } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SHIP_CONFIG } from '../../../config/shipConfig';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { SpaceshipModel } from './SpaceshipModel';
import { nexusAudio } from '../../../utils/nexusAudio';
import { getTerrainHeight } from '../surface/terrainMath';

export interface SpaceshipControllerProps {
  initialPosition?: [number, number, number];
}

export const SpaceshipController: FC<SpaceshipControllerProps> = ({
  initialPosition = [0, 8, 12]
}) => {
  const shipGroupRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  // 3-Axis Velocities (Local & World)
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const currentSpeed = useRef(0);
  const currentVerticalSpeed = useRef(0);
  const currentThrottle = useRef(0);
  const isBoostingRef = useRef(false);
  const isBrakingRef = useRef(false);

  // Rotation Euler
  const shipEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const bankAngle = useRef(0);
  const pitchAngle = useRef(0);

  // Camera Mode: 0 = Chase, 1 = Cockpit
  const [cameraMode, setCameraMode] = useState<0 | 1>(0);

  // Key tracking state
  const keys = useRef<Record<string, boolean>>({});
  const lastTelemetryTime = useRef(0);
  const lastPosY = useRef(initialPosition[1]);

  const {
    gameMode,
    flightAssist,
    initiateLandingSequence,
    completeTouchdown,
    finishTakeoff,
    setHoveredEntity,
    addAlert,
    setFlight3DTelemetry,
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
      currentVerticalSpeed.current = -3.5;
      currentThrottle.current = 0.35;

      shipEuler.current.x = THREE.MathUtils.lerp(shipEuler.current.x, 0, dt * 3.0);
      shipEuler.current.z = THREE.MathUtils.lerp(shipEuler.current.z, 0, dt * 3.0);
      ship.rotation.copy(shipEuler.current);

      ship.position.x = THREE.MathUtils.lerp(ship.position.x, 0, dt * 1.8);
      ship.position.z = THREE.MathUtils.lerp(ship.position.z, 0, dt * 1.8);
      ship.position.y = THREE.MathUtils.lerp(ship.position.y, -0.2, dt * 1.5);

      if (dustRef.current) {
        dustRef.current.visible = true;
        dustRef.current.rotation.y += dt * 3.0;
      }

      if (ship.position.y <= -0.1 && Math.abs(ship.position.x) < 0.8 && Math.abs(ship.position.z) < 0.8) {
        ship.position.set(0, -0.2, 0);
        currentThrottle.current = 0;
        currentVerticalSpeed.current = 0;
        if (dustRef.current) dustRef.current.visible = false;
        completeTouchdown();
      }

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
      currentVerticalSpeed.current = 8.5;

      ship.position.y += dt * 7.5;
      shipEuler.current.x = THREE.MathUtils.lerp(shipEuler.current.x, 0.35, dt * 2.0);
      ship.rotation.copy(shipEuler.current);

      if (dustRef.current) {
        dustRef.current.visible = ship.position.y < 8;
        dustRef.current.rotation.y += dt * 5.0;
      }

      if (ship.position.y >= 14) {
        if (dustRef.current) dustRef.current.visible = false;
        finishTakeoff();
      }

      const camTarget = ship.position.clone().add(new THREE.Vector3(0, 4.0, -12.0));
      camera.position.lerp(camTarget, dt * 5.0);
      camera.lookAt(ship.position.clone().add(new THREE.Vector3(0, 1.0, 10.0)));
      return;
    }

    if (dustRef.current) dustRef.current.visible = false;

    if (gameMode !== 'SPACE_FLIGHT' && gameMode !== 'ORBIT') {
      return;
    }

    // ==========================================
    // 3. FULL 6-DOF 3-AXIS SPACESHIP FLIGHT
    // ==========================================
    const k = keys.current;
    const forwardInput = (k['W'] || k['KeyW'] || k['ArrowUp']) ? 1 : (k['S'] || k['KeyS'] || k['ArrowDown']) ? -0.8 : 0;
    const yawInput = (k['A'] || k['KeyA'] || k['ArrowLeft']) ? 1 : (k['D'] || k['KeyD'] || k['ArrowRight']) ? -1 : 0;
    const rollInput = (k['Q'] || k['KeyQ']) ? 1 : (k['E'] || k['KeyE']) ? -1 : 0;
    const pitchInput = (k['R'] || k['KeyR']) ? 1 : (k['F'] || k['KeyF']) ? -1 : 0;

    // Controlled Vertical Thrust: Space/PageUp = Ascend, C/Z/Ctrl/PageDown/ArrowDown = Descend
    const ascendInput = (k['Space'] || k[' '] || k['PageUp']) ? 1 : 0;
    const descendInput = (
      k['KeyZ'] || k['Z'] ||
      k['ControlLeft'] || k['ControlRight'] || k['Control'] ||
      k['KeyC'] || k['C'] ||
      k['PageDown'] ||
      k['ArrowDown']
    ) ? 1 : 0;
    const verticalInput = ascendInput - descendInput;

    const boostInput = (k['ShiftLeft'] || k['ShiftRight'] || k['Shift']) && forwardInput > 0;
    const brakeInput = (k['KeyX'] || k['X']);

    isBoostingRef.current = !!boostInput;
    isBrakingRef.current = !!brakeInput;

    // Forward Acceleration & Throttle
    const targetMaxSpeed = boostInput ? SHIP_CONFIG.boostSpeed : SHIP_CONFIG.maxSpeed;

    if (forwardInput > 0) {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetMaxSpeed, dt * (boostInput ? 3.5 : 2.0));
      currentThrottle.current = THREE.MathUtils.lerp(currentThrottle.current, boostInput ? 1.0 : 0.7, dt * 4);
    } else if (forwardInput < 0) {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, SHIP_CONFIG.minSpeed, dt * 2.5);
      currentThrottle.current = 0;
    } else if (brakeInput) {
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, 0, dt * 5.0);
      currentVerticalSpeed.current = THREE.MathUtils.lerp(currentVerticalSpeed.current, 0, dt * 5.0);
      currentThrottle.current = 0;
    } else {
      const damp = flightAssist ? SHIP_CONFIG.dampingLinear : 0.995;
      currentSpeed.current *= Math.pow(damp, dt * 60);
      currentThrottle.current = THREE.MathUtils.lerp(currentThrottle.current, 0, dt * 3);
    }

    // Vertical Acceleration & Damping
    if (verticalInput !== 0) {
      const targetVert = verticalInput * SHIP_CONFIG.verticalMaxSpeed;
      currentVerticalSpeed.current = THREE.MathUtils.lerp(currentVerticalSpeed.current, targetVert, dt * 3.5);
    } else {
      const dampV = flightAssist ? SHIP_CONFIG.verticalDamping : 0.992;
      currentVerticalSpeed.current *= Math.pow(dampV, dt * 60);
    }

    // Yaw, Pitch, Roll Rotations
    const yawDelta = yawInput * SHIP_CONFIG.yawSpeed * dt;
    shipEuler.current.y += yawDelta;

    const targetBank = yawInput * SHIP_CONFIG.bankFactor + rollInput * 0.8;
    bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, dt * 6.0);
    shipEuler.current.z = bankAngle.current;

    pitchAngle.current = THREE.MathUtils.lerp(pitchAngle.current, pitchInput * 0.6, dt * 5.0);
    shipEuler.current.x = pitchAngle.current;

    ship.rotation.copy(shipEuler.current);

    // Full 3-Axis Directional Translation
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(shipEuler.current);
    const upDir = new THREE.Vector3(0, 1, 0).applyEuler(shipEuler.current);

    // Velocity combines forward translation + vertical translation
    velocity.current.set(0, 0, 0);
    velocity.current.addScaledVector(forwardDir, currentSpeed.current);
    velocity.current.addScaledVector(upDir, currentVerticalSpeed.current);

    ship.position.addScaledVector(velocity.current, dt);

    // Boundary clamp: 350m spatial perimeter
    const distFromOrigin = ship.position.length();
    if (distFromOrigin > 350) {
      ship.position.clampLength(0, 349);
      currentSpeed.current *= 0.5;
    }

    // Real-Time Altitude & Terrain Clearance
    const surfaceY = getTerrainHeight(ship.position.x, ship.position.z);
    const clearanceAltitude = ship.position.y - surfaceY;

    // Minimum hard safety cushion to prevent plunging through subterranean bedrock
    if (ship.position.y < surfaceY + 0.5) {
      ship.position.y = surfaceY + 0.5;
      if (currentVerticalSpeed.current < 0) currentVerticalSpeed.current = 0;
    }

    // Intelligent Flight Warnings Evaluation
    const warnings: string[] = [];
    const vSpeed = (ship.position.y - lastPosY.current) / Math.max(dt, 0.001);
    lastPosY.current = ship.position.y;

    if (clearanceAltitude < 3.0 && ship.position.y < 25) {
      warnings.push('CRITICAL ALTITUDE');
    } else if (clearanceAltitude < 8.0 && ship.position.y < 35) {
      warnings.push('LOW ALTITUDE');
    }

    if (vSpeed < -14.0 && clearanceAltitude < 30) {
      warnings.push('HIGH DESCENT RATE');
    }

    // Ahead Obstacle Detection Sensor (Raycast/Heightfield probe)
    const probeX = ship.position.x + forwardDir.x * 20.0;
    const probeZ = ship.position.z + forwardDir.z * 20.0;
    const probeH = getTerrainHeight(probeX, probeZ);
    if (ship.position.y - probeH < 2.5 && currentSpeed.current > 8.0) {
      warnings.push('OBSTACLE AHEAD');
    }

    // Landing Zone Detection
    const padDist = ship.position.distanceTo(new THREE.Vector3(0, -1.5, 0));
    if (padDist < 45) {
      const hDist = Math.hypot(ship.position.x, ship.position.z);
      setHoveredEntity({
        name: 'AETHELIA-IV PRIMARY PAD',
        type: 'COLONY LANDING ZONE',
        distanceM: Math.round(padDist * 10),
        actionPrompt: `H: ${Math.round(hDist * 10)}M · ALT: ${Math.round(clearanceAltitude * 10)}M // PRESS [E] TO LAND`
      });
    } else {
      const astDist = ship.position.distanceTo(new THREE.Vector3(8, 3, -6));
      if (astDist < SHIP_CONFIG.interaction.asteroidScanDistance) {
        setHoveredEntity({
          name: 'TITANIUM ASTEROID-047',
          type: 'MINABLE ASTEROID',
          distanceM: Math.round(astDist * 15),
          actionPrompt: 'PRESS [E] TO SCAN / MINE'
        });
      }
    }

    // Dynamic camera follow adjusting for climb/dive
    if (cameraMode === 0) {
      const cameraOffset = new THREE.Vector3(
        0,
        SHIP_CONFIG.camera.chaseHeight + (currentVerticalSpeed.current * 0.05),
        -SHIP_CONFIG.camera.chaseDistance
      );
      if (boostInput) cameraOffset.z -= 2.0;
      cameraOffset.applyEuler(shipEuler.current);

      const targetCamPos = ship.position.clone().add(cameraOffset);
      // Ensure chase camera doesn't clip underground
      const camTerrainY = getTerrainHeight(targetCamPos.x, targetCamPos.z) + 0.8;
      if (targetCamPos.y < camTerrainY) targetCamPos.y = camTerrainY;

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

    // UI Telemetry Sync
    if (state.clock.elapsedTime - lastTelemetryTime.current > 0.08) {
      lastTelemetryTime.current = state.clock.elapsedTime;
      const headingDeg = ((-shipEuler.current.y * 180 / Math.PI) % 360 + 360) % 360;
      const pitchDeg = shipEuler.current.x * 180 / Math.PI;
      const rollDeg = shipEuler.current.z * 180 / Math.PI;

      setFlight3DTelemetry({
        speed: currentSpeed.current,
        verticalSpeed: vSpeed,
        altitude: clearanceAltitude,
        heading: headingDeg,
        pitch: pitchDeg,
        roll: rollDeg,
        isBoosting: !!boostInput,
        isBraking: !!brakeInput,
        warnings
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
