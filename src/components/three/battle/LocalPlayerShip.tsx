import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipModel } from '../spaceships/SpaceshipModel';
import { SHIP_CONFIG } from '../../../config/shipConfig';
import { SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { sendInput, sendShoot } from '../../../multiplayer/socketClient';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { nexusAudio } from '../../../utils/nexusAudio';

export const LocalPlayerShip: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const playerColor = useMultiplayerStore(state => state.playerColor);
  const selfState = useMultiplayerStore(state => state.selfState);
  const updateSoloSelf = useMultiplayerStore(state => state.updateSoloSelf);
  const addSoloProjectile = useMultiplayerStore(state => state.addSoloProjectile);
  
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [isMouseDown, setIsMouseDown] = useState(false);
  
  const velocity = useRef(new THREE.Vector3());
  const rotationEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const lastSendTime = useRef(0);
  const lastShootTime = useRef(0);
  const initialPosSet = useRef(false);

  const getPaintScheme = (): SpaceshipPaintSchemeKey => {
    switch(playerColor) {
      case 'yellow': return 'battle_yellow';
      case 'blue': return 'battle_blue';
      case 'red': return 'battle_red';
      case 'green': return 'battle_green';
      default: return 'battle_yellow';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: true, [e.key.toUpperCase()]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: false, [e.key.toUpperCase()]: false }));
    const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) setIsMouseDown(true); };
    const handleMouseUp = (e: MouseEvent) => { if (e.button === 0) setIsMouseDown(false); };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Initialize position from server or solo initial
    if (selfState && !initialPosSet.current) {
      group.current.position.set(selfState.position[0], selfState.position[1], selfState.position[2]);
      rotationEuler.current.set(selfState.rotation[0], selfState.rotation[1], selfState.rotation[2], 'YXZ');
      group.current.quaternion.setFromEuler(rotationEuler.current);
      initialPosSet.current = true;
    }

    const dt = Math.min(delta, 0.1);

    // Movement Controls
    const isBoosting = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['SHIFT']);
    const isBraking = !!(keys['KeyX'] || keys['X']);
    
    const forwardInput = (keys['KeyW'] || keys['W']) ? 1 : (keys['KeyS'] || keys['S']) ? -0.8 : 0;
    const yawInput = (keys['KeyA'] || keys['A']) ? 1 : (keys['KeyD'] || keys['D']) ? -1 : 0;
    const rollInput = (keys['KeyQ'] || keys['Q']) ? 1 : (keys['KeyE'] || keys['E']) ? -1 : 0;
    const pitchInput = (keys['KeyR'] || keys['R']) ? 1 : (keys['KeyF'] || keys['F']) ? -1 : 0;

    const ascendInput = (keys['KeyE'] || keys['PageUp'] || keys['Equal']) ? 1 : 0;
    const descendInput = (keys['KeyZ'] || keys['Z'] || keys['ControlLeft'] || keys['ControlRight']) ? 1 : 0;
    const verticalInput = ascendInput - descendInput;

    // Speed calculation
    const targetMaxSpeed = isBoosting ? SHIP_CONFIG.boostSpeed : SHIP_CONFIG.maxSpeed;
    let targetSpeed = 0;
    if (forwardInput > 0) {
      targetSpeed = targetMaxSpeed;
    } else if (forwardInput < 0) {
      targetSpeed = SHIP_CONFIG.minSpeed;
    }

    if (isBraking) {
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, 0, dt * 5.0);
      velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, 0, dt * 5.0);
    } else {
      const accel = forwardInput !== 0 ? (isBoosting ? 3.5 : 2.0) : 1.5;
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetSpeed, dt * accel);

      const targetVert = verticalInput * SHIP_CONFIG.verticalMaxSpeed;
      velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, targetVert, dt * 3.5);
    }

    // Rotation
    rotationEuler.current.y += yawInput * SHIP_CONFIG.yawSpeed * dt;
    rotationEuler.current.x = THREE.MathUtils.lerp(rotationEuler.current.x, pitchInput * 0.6, dt * 5.0);
    const targetBank = yawInput * SHIP_CONFIG.bankFactor + rollInput * 0.8;
    rotationEuler.current.z = THREE.MathUtils.lerp(rotationEuler.current.z, targetBank, dt * 6.0);

    group.current.quaternion.setFromEuler(rotationEuler.current);
    
    // Translation
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(rotationEuler.current);
    const upDir = new THREE.Vector3(0, 1, 0).applyEuler(rotationEuler.current);

    group.current.position.addScaledVector(forwardDir, velocity.current.z * dt);
    group.current.position.addScaledVector(upDir, velocity.current.y * dt);
    
    // Boundary clamp: 300 unit arena perimeter
    const dist = group.current.position.length();
    if (dist > 300) {
      group.current.position.clampLength(0, 299);
      velocity.current.z *= 0.5;
    }

    // Smooth Chase Camera
    const cameraOffset = new THREE.Vector3(
      0,
      SHIP_CONFIG.camera.chaseHeight,
      -SHIP_CONFIG.camera.chaseDistance
    );
    if (isBoosting) cameraOffset.z -= 2.0;
    cameraOffset.applyEuler(rotationEuler.current);

    const targetCamPos = group.current.position.clone().add(cameraOffset);
    camera.position.lerp(targetCamPos, SHIP_CONFIG.camera.chaseLag * (dt * 60));

    const lookTarget = group.current.position.clone().add(forwardDir.clone().multiplyScalar(20));
    camera.lookAt(lookTarget);

    const now = performance.now();

    // Solo mode self update vs Multiplayer socket input
    if (isSolo) {
      updateSoloSelf(
        [group.current.position.x, group.current.position.y, group.current.position.z],
        [rotationEuler.current.x, rotationEuler.current.y, rotationEuler.current.z],
        [forwardDir.x * velocity.current.z, forwardDir.y * velocity.current.z, forwardDir.z * velocity.current.z],
        selfState?.hp ?? 100,
        isBoosting,
        Math.min(Math.abs(velocity.current.z) / SHIP_CONFIG.maxSpeed, 1)
      );
    } else {
      if (now - lastSendTime.current > 33) {
        sendInput({
          thrust: forwardInput,
          yaw: yawInput,
          pitch: pitchInput,
          roll: rollInput,
          vertical: verticalInput,
          boost: isBoosting,
          brake: isBraking
        });
        lastSendTime.current = now;
      }
    }
    
    // Shooting (Left-click, Space, or J)
    const isShooting = isMouseDown || keys['Space'] || keys[' '];
    if (isShooting && now - lastShootTime.current > 280) {
      if (isSolo) {
        const laserDir = forwardDir.clone().multiplyScalar(150);
        addSoloProjectile({
          id: `solo_laser_${Math.random()}`,
          ownerId: 'solo_player',
          position: [group.current.position.x, group.current.position.y + 0.2, group.current.position.z],
          direction: [laserDir.x, laserDir.y, laserDir.z],
          color: playerColor,
          createdAt: Date.now()
        });
        nexusAudio.playLaser();
      } else {
        sendShoot();
      }
      lastShootTime.current = now;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <SpaceshipModel 
        paintScheme={getPaintScheme()} 
        throttle={Math.min(Math.abs(velocity.current.z) / SHIP_CONFIG.maxSpeed, 1)}
        isBoosting={keys['ShiftLeft'] || keys['ShiftRight'] || keys['SHIFT']}
        damaged={selfState?.hp !== undefined && selfState.hp < 40}
      />
    </group>
  );
};
