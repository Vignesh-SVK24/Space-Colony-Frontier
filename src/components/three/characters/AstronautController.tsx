import { useRef, useEffect, type FC } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNexusGameStore } from '../../../state/useNexusGameStore';
import { AstronautModel } from './AstronautModel';
import { getTerrainHeight } from '../surface/terrainMath';

export const AstronautController: FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const {
    astronautPosition,
    setAstronautTelemetry,
    astronautScannerActive,
    toggleAstronautScanner,
    boardShip,
    landedShipPosition,
    planetaryPOIs,
    interactWithPOI,
    setHoveredEntity
  } = useNexusGameStore();

  // Internal state
  const pos = useRef(new THREE.Vector3(...astronautPosition));
  const velocity = useRef(new THREE.Vector3());
  const characterYaw = useRef(0);
  const animState = useRef<'IDLE' | 'WALK' | 'RUN' | 'SCAN' | 'INTERACT' | 'BOARD'>('IDLE');

  // Camera Orbit angles
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.28);
  const cameraDist = useRef(4.6);
  const isDraggingMouse = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  // Key tracking
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toUpperCase();
      keys.current[k] = true;
      keys.current[e.code] = true;

      if (k === 'F') {
        toggleAstronautScanner();
      }

      if (k === 'E') {
        // Proximity checks
        const p = pos.current;
        const dShip = Math.hypot(p.x - landedShipPosition[0], p.z - landedShipPosition[2]);
        if (dShip < 6.0) {
          boardShip();
          return;
        }

        // Closest POI
        for (const poi of planetaryPOIs) {
          const dPoi = Math.hypot(p.x - poi.position[0], p.z - poi.position[2]);
          if (dPoi < 4.5) {
            animState.current = 'INTERACT';
            setTimeout(() => {
              if (animState.current === 'INTERACT') animState.current = 'IDLE';
            }, 1200);
            interactWithPOI(poi.id);
            break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      keys.current[k] = false;
      keys.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingMouse.current = true;
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingMouse.current) return;
      const dx = e.clientX - lastMouseX.current;
      const dy = e.clientY - lastMouseY.current;
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;

      cameraYaw.current -= dx * 0.006;
      cameraPitch.current = THREE.MathUtils.clamp(cameraPitch.current + dy * 0.005, 0.05, 1.25);
    };

    const handleMouseUp = () => {
      isDraggingMouse.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      cameraDist.current = THREE.MathUtils.clamp(cameraDist.current + e.deltaY * 0.004, 2.5, 9.0);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const dom = gl.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [gl, landedShipPosition, planetaryPOIs, boardShip, interactWithPOI, toggleAstronautScanner]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const k = keys.current;

    // Movement inputs
    const forward = (k['W'] || k['KeyW'] || k['ArrowUp']) ? 1 : (k['S'] || k['KeyS'] || k['ArrowDown']) ? -1 : 0;
    const strafe = (k['D'] || k['KeyD'] || k['ArrowRight']) ? 1 : (k['A'] || k['KeyA'] || k['ArrowLeft']) ? -1 : 0;
    const isRunning = (k['ShiftLeft'] || k['ShiftRight'] || k['Shift']) && forward > 0;

    const moveInput = new THREE.Vector3(strafe, 0, -forward);
    const isInputActive = moveInput.lengthSq() > 0.01;

    let targetSpeed = 0;
    if (isInputActive) {
      targetSpeed = isRunning ? 6.5 : (forward < 0 ? 2.0 : 3.4);
      moveInput.normalize();

      // Transform input vector relative to camera azimuth
      moveInput.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw.current);

      // Target character heading
      const targetHeading = Math.atan2(moveInput.x, moveInput.z);
      // Smooth shortest angular turn
      let diff = targetHeading - characterYaw.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      characterYaw.current += diff * Math.min(1.0, dt * 10);
    }

    // Accelerate / decelerate horizontal velocity
    const targetVel = moveInput.clone().multiplyScalar(targetSpeed);
    velocity.current.lerp(targetVel, dt * 8.0);

    // Apply horizontal translation
    pos.current.x += velocity.current.x * dt;
    pos.current.z += velocity.current.z * dt;

    // Clamp horizontally to stay within active 140m planetary radius
    const dFromOrigin = Math.hypot(pos.current.x, pos.current.z);
    if (dFromOrigin > 135) {
      const angle = Math.atan2(pos.current.z, pos.current.x);
      pos.current.x = Math.cos(angle) * 135;
      pos.current.z = Math.sin(angle) * 135;
    }

    // Ground clamping via exact mathematical terrain function
    const surfaceY = getTerrainHeight(pos.current.x, pos.current.z);
    pos.current.y = surfaceY;

    // Update group transform
    if (groupRef.current) {
      groupRef.current.position.copy(pos.current);
      groupRef.current.rotation.y = characterYaw.current;
    }

    // Determine animation state
    const currentSpeed = velocity.current.length();
    if (animState.current !== 'INTERACT') {
      if (astronautScannerActive) {
        animState.current = 'SCAN';
      } else if (currentSpeed > 4.0) {
        animState.current = 'RUN';
      } else if (currentSpeed > 0.2) {
        animState.current = 'WALK';
      } else {
        animState.current = 'IDLE';
      }
    }

    // Dynamic 3rd person orbit camera follow
    const camOffset = new THREE.Vector3(
      Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current),
      Math.sin(cameraPitch.current),
      Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current)
    ).multiplyScalar(cameraDist.current);

    const lookTarget = pos.current.clone().add(new THREE.Vector3(0, 1.4, 0));
    const targetCamPos = lookTarget.clone().add(camOffset);

    // Prevent camera clipping under terrain
    const camTerrainY = getTerrainHeight(targetCamPos.x, targetCamPos.z) + 0.6;
    if (targetCamPos.y < camTerrainY) targetCamPos.y = camTerrainY;

    camera.position.lerp(targetCamPos, Math.min(1.0, dt * 10));
    camera.lookAt(lookTarget);

    // Sync astronaut telemetry
    setAstronautTelemetry(
      [pos.current.x, pos.current.y, pos.current.z],
      characterYaw.current,
      animState.current
    );

    // Hover UI detection for landed ship & POIs
    const dShip = Math.hypot(pos.current.x - landedShipPosition[0], pos.current.z - landedShipPosition[2]);
    if (dShip < 6.0) {
      setHoveredEntity({
        name: 'FRONTIER RECON CRAFT',
        type: 'LANDED SPACECRAFT',
        distanceM: Math.round(dShip),
        actionPrompt: 'PRESS [E] TO BOARD SHIP // RETRACT LANDING GEAR'
      });
    } else {
      let foundPoi = false;
      for (const poi of planetaryPOIs) {
        const dPoi = Math.hypot(pos.current.x - poi.position[0], pos.current.z - poi.position[2]);
        if (dPoi < 5.0) {
          foundPoi = true;
          setHoveredEntity({
            name: poi.name,
            type: poi.type.toUpperCase(),
            distanceM: Math.round(dPoi),
            actionPrompt: poi.interacted ? 'DATABASE ARCHIVED' : `PRESS [E] TO ACCESS // ${poi.rewardText || ''}`
          });
          break;
        }
      }
      if (!foundPoi && dShip >= 6.0) {
        // Clear hover if far
      }
    }
  });

  return (
    <group ref={groupRef} position={astronautPosition}>
      <AstronautModel
        animationState={animState.current}
        speed={velocity.current.length()}
        isMoving={velocity.current.length() > 0.15}
        isGrounded={true}
      />
    </group>
  );
};
