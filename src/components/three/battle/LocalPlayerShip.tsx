import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipModel } from '../spaceships/SpaceshipModel';
import { SHIP_CONFIG } from '../../../config/shipConfig';
import { COMBAT_CONFIG } from '../../../config/combatConfig';
import { checkObstacleRaycast } from '../../../config/arenaObstacles';
import { SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { sendInput, sendShoot, sendLaser } from '../../../multiplayer/socketClient';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { nexusAudio } from '../../../utils/nexusAudio';

export const LocalPlayerShip: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const playerColor = useMultiplayerStore(state => state.playerColor);
  const selfState = useMultiplayerStore(state => state.selfState);
  const opponentState = useMultiplayerStore(state => state.opponentState);
  const otherPlayers = useMultiplayerStore(state => state.otherPlayers);
  
  const updateSoloSelf = useMultiplayerStore(state => state.updateSoloSelf);
  const addSoloProjectile = useMultiplayerStore(state => state.addSoloProjectile);
  const applyDamageToSoloOpponent = useMultiplayerStore(state => state.applyDamageToSoloOpponent);
  const setActiveLaserBeam = useMultiplayerStore(state => state.setActiveLaserBeam);
  const setLaserCooldownRemaining = useMultiplayerStore(state => state.setLaserCooldownRemaining);
  const setBulletCooldownRemaining = useMultiplayerStore(state => state.setBulletCooldownRemaining);
  const setTargetLock = useMultiplayerStore(state => state.setTargetLock);
  const setLeadIndicator = useMultiplayerStore(state => state.setLeadIndicator);
  
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [isMouseDownLeft, setIsMouseDownLeft] = useState(false);
  const [isMouseDownRight, setIsMouseDownRight] = useState(false);
  
  const velocity = useRef(new THREE.Vector3());
  const rotationEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const lastSendTime = useRef(0);
  const lastBulletTime = useRef(0);
  const lastLaserTime = useRef(0);
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
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) setIsMouseDownLeft(true);
      if (e.button === 2) {
        e.preventDefault();
        setIsMouseDownRight(true);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) setIsMouseDownLeft(false);
      if (e.button === 2) {
        e.preventDefault();
        setIsMouseDownRight(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Initialize position on first spawn
    if (selfState && !initialPosSet.current) {
      group.current.position.set(selfState.position[0], selfState.position[1], selfState.position[2]);
      rotationEuler.current.set(selfState.rotation[0], selfState.rotation[1], selfState.rotation[2], 'YXZ');
      group.current.quaternion.setFromEuler(rotationEuler.current);
      initialPosSet.current = true;
    }

    const dt = Math.min(delta, 0.1);

    // ==========================================
    // 1. Flight Controls & Dynamics
    // ==========================================
    const isBoosting = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['SHIFT']);
    const isBraking = !!(keys['KeyX'] || keys['X']);
    
    // Read 360-degree analog joystick input
    const joystickAxis = useMultiplayerStore.getState().joystickAxis || { x: 0, y: 0 };
    const joyMag = Math.sqrt(joystickAxis.x * joystickAxis.x + joystickAxis.y * joystickAxis.y);

    const keyForward = (keys['KeyW'] || keys['W']) ? 1 : (keys['KeyS'] || keys['S']) ? -0.8 : 0;
    const keyYaw = (keys['KeyA'] || keys['A']) ? 1 : (keys['KeyD'] || keys['D']) ? -1 : 0;

    // Analog translation: y > 0 is forward, y < 0 is reverse, x < 0 is steer left, x > 0 is steer right
    const joyForward = joystickAxis.y > 0 ? joystickAxis.y : joystickAxis.y * 0.8;
    const joyYaw = -joystickAxis.x;

    const forwardInput = joyMag > 0.05 ? joyForward : keyForward;
    const yawInput = joyMag > 0.05 ? joyYaw : keyYaw;
    const rollInput = (keys['KeyQ'] || keys['Q']) ? 1 : (keys['KeyE'] || keys['E']) ? -1 : 0;
    const pitchInput = (keys['KeyR'] || keys['R']) ? 1 : (keys['KeyF'] || keys['F']) ? -1 : 0;

    const ascendInput = (keys['Space'] || keys['KeyE'] || keys['PageUp']) ? 1 : 0;
    const descendInput = (keys['KeyC'] || keys['KeyZ'] || keys['KeyQ'] || keys['ControlLeft'] || keys['ControlRight']) ? 1 : 0;
    const verticalInput = ascendInput - descendInput;

    const targetMaxSpeed = isBoosting ? COMBAT_CONFIG.SHIP_BOOST_SPEED : COMBAT_CONFIG.SHIP_MAX_SPEED;
    let targetSpeed = 0;
    if (forwardInput > 0) targetSpeed = targetMaxSpeed * Math.min(1, forwardInput);
    else if (forwardInput < 0) targetSpeed = COMBAT_CONFIG.SHIP_MIN_SPEED * Math.min(1, Math.abs(forwardInput));

    if (isBraking) {
      velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, 0, dt * 5.0);
      velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, 0, dt * 5.0);
    } else {
      const accel = forwardInput !== 0 ? (isBoosting ? 3.8 : 2.2) : 1.5;
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
    
    // Boundary Enforcement: 300m sphere
    const dist = group.current.position.length();
    if (dist > COMBAT_CONFIG.ARENA_RADIUS) {
      group.current.position.clampLength(0, COMBAT_CONFIG.ARENA_RADIUS - 1);
      velocity.current.z *= 0.5;
    }

    // Camera Chase
    const cameraOffset = new THREE.Vector3(
      0,
      SHIP_CONFIG.camera.chaseHeight,
      -SHIP_CONFIG.camera.chaseDistance
    );
    if (isBoosting) cameraOffset.z -= 2.0;
    cameraOffset.applyEuler(rotationEuler.current);

    const targetCamPos = group.current.position.clone().add(cameraOffset);
    camera.position.lerp(targetCamPos, SHIP_CONFIG.camera.chaseLag * (dt * 60));

    const lookTarget = group.current.position.clone().add(forwardDir.clone().multiplyScalar(25));
    camera.lookAt(lookTarget);

    const now = performance.now();

    // ==========================================
    // 2. Server Reconciliation (Multiplayer)
    // ==========================================
    if (!isSolo && selfState) {
      const serverPos = new THREE.Vector3(...selfState.position);
      const posError = group.current.position.distanceTo(serverPos);

      if (posError > 8.0) {
        // Snap directly if extreme drift / teleports
        group.current.position.copy(serverPos);
      } else if (posError > 0.4) {
        // Smoothly correct drift
        group.current.position.lerp(serverPos, dt * 4.0);
      }
    }

    // ==========================================
    // 3. Target Lock & Holographic Lead Indicator (Multi-Target Aware)
    // ==========================================
    const candidates = (otherPlayers.length > 0 ? otherPlayers : (opponentState ? [opponentState] : []))
      .filter(p => p && p.alive && p.hp > 0);

    let bestTarget: any = null;
    let minAngle = 0.55;
    let bestDist = Infinity;

    for (const cand of candidates) {
      const pos = new THREE.Vector3(...cand.position);
      const toCand = new THREE.Vector3().subVectors(pos, group.current.position);
      const dist = toCand.length();
      if (dist < 260) {
        const angle = forwardDir.angleTo(toCand.clone().normalize());
        if (angle < minAngle) {
          minAngle = angle;
          bestTarget = cand;
          bestDist = dist;
        }
      }
    }

    let aimDist = 120;
    if (bestTarget) {
      const oppPos = new THREE.Vector3(...bestTarget.position);
      const oppVel = new THREE.Vector3(...bestTarget.velocity);
      const range = Math.floor(bestDist);

      setTargetLock({
        id: bestTarget.id,
        name: bestTarget.name,
        distance: range,
        hp: bestTarget.hp
      });

      if (range < 220) {
        const timeToHit = range / COMBAT_CONFIG.BULLET_SPEED;
        const leadWorld = oppPos.clone().add(oppVel.clone().multiplyScalar(timeToHit));
        setLeadIndicator({
          worldPos: [leadWorld.x, leadWorld.y, leadWorld.z],
          distance: range,
          visible: true
        });
      } else {
        setLeadIndicator(null);
      }

      aimDist = Math.max(15, Math.min(260, bestDist));
    } else {
      setTargetLock(null);
      setLeadIndicator(null);
    }

    // ==========================================
    // 4. Weapon Cooldown Timers & Crosshair Ray Convergence
    // ==========================================
    const bulletCdLeft = Math.max(0, COMBAT_CONFIG.BULLET_COOLDOWN - (now - lastBulletTime.current) / 1000);
    setBulletCooldownRemaining(bulletCdLeft);

    const laserCdLeft = Math.max(0, COMBAT_CONFIG.LASER_COOLDOWN - (now - lastLaserTime.current) / 1000);
    setLaserCooldownRemaining(laserCdLeft);

    // Muzzle position in world space
    const muzzlePos = group.current.position.clone().add(forwardDir.clone().multiplyScalar(2.0));

    // Camera aim ray & 3D crosshair convergence
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    const aimTargetPoint = camera.position.clone().addScaledVector(camDir, aimDist);
    const aimFireDir = new THREE.Vector3().subVectors(aimTargetPoint, muzzlePos).normalize();

    // ==========================================
    // 5. Primary Weapon: PLASMA BULLET (0.45s)
    // ==========================================
    const shootBullet = isMouseDownLeft || keys['KeyJ'];
    if (shootBullet && now - lastBulletTime.current > COMBAT_CONFIG.BULLET_COOLDOWN * 1000) {
      lastBulletTime.current = now;
      const attackId = `BULLET_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      if (isSolo) {
        const bulletVel = aimFireDir.clone().multiplyScalar(COMBAT_CONFIG.BULLET_SPEED);
        addSoloProjectile({
          id: attackId,
          ownerId: 'solo_player',
          position: [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          direction: [bulletVel.x, bulletVel.y, bulletVel.z],
          color: playerColor,
          createdAt: Date.now()
        });
        nexusAudio.playLaser();
      } else {
        sendShoot(
          [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          [aimFireDir.x, aimFireDir.y, aimFireDir.z],
          attackId
        );
        nexusAudio.playLaser();
      }
    }

    // ==========================================
    // 6. Secondary Weapon: LASER BEAM (5.0s RECHARGE)
    // ==========================================
    const shootLaser = isMouseDownRight || keys['KeyK'] || keys['KeyL'];
    if (shootLaser && now - lastLaserTime.current > COMBAT_CONFIG.LASER_COOLDOWN * 1000) {
      lastLaserTime.current = now;
      const attackId = `LASER_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (isSolo) {
        nexusAudio.playLaser();

        const emitterPos = muzzlePos.clone();
        const maxBeamEnd = emitterPos.clone().add(aimFireDir.clone().multiplyScalar(COMBAT_CONFIG.LASER_RANGE));

        // Raycast against all obstacles
        const raycast = checkObstacleRaycast(
          emitterPos.x, emitterPos.y, emitterPos.z,
          maxBeamEnd.x, maxBeamEnd.y, maxBeamEnd.z
        );

        let actualEnd: [number, number, number];
        let blockedByObstacle = false;

        if (raycast.blocked && raycast.hitPoint) {
          actualEnd = raycast.hitPoint;
          blockedByObstacle = true;
        } else {
          actualEnd = [maxBeamEnd.x, maxBeamEnd.y, maxBeamEnd.z];
        }

        // Check if enemy is in beam path before any obstacle
        let hitEnemy = false;
        if (opponentState) {
          const oppPos = new THREE.Vector3(...opponentState.position);
          const toOpp = new THREE.Vector3().subVectors(oppPos, emitterPos);
          const oppDist = toOpp.length();

          if (oppDist <= COMBAT_CONFIG.LASER_RANGE) {
            const oppDir = toOpp.clone().normalize();
            const angle = aimFireDir.angleTo(oppDir);

            // Beam cone test (~6.9 degrees)
            if (angle < COMBAT_CONFIG.LASER_AIM_CONE) {
              if (!blockedByObstacle || (raycast.distance > oppDist)) {
                actualEnd = [oppPos.x, oppPos.y, oppPos.z];
                hitEnemy = true;
                blockedByObstacle = false;
              }
            }
          }
        }

        setActiveLaserBeam({
          shooterId: 'solo_player',
          start: [emitterPos.x, emitterPos.y, emitterPos.z],
          end: actualEnd,
          blocked: blockedByObstacle,
          color: playerColor,
          timestamp: Date.now()
        });

        if (hitEnemy) {
          applyDamageToSoloOpponent(COMBAT_CONFIG.LASER_DAMAGE);
          nexusAudio.playHit();
        }
      } else {
        // Authoritative multiplayer laser: sent to server, server validates line-of-sight & cooldown
        sendLaser(
          [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          [aimFireDir.x, aimFireDir.y, aimFireDir.z],
          attackId
        );
      }
    }

    // ==========================================
    // 7. State Sync / Telemetry
    // ==========================================
    if (isSolo) {
      updateSoloSelf(
        [group.current.position.x, group.current.position.y, group.current.position.z],
        [rotationEuler.current.x, rotationEuler.current.y, rotationEuler.current.z],
        [forwardDir.x * velocity.current.z, forwardDir.y * velocity.current.z, forwardDir.z * velocity.current.z],
        selfState?.hp ?? 100,
        isBoosting,
        Math.min(Math.abs(velocity.current.z) / COMBAT_CONFIG.SHIP_MAX_SPEED, 1)
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
  });

  const showCombatHitboxes = useMultiplayerStore(state => state.showCombatHitboxes);

  return (
    <group ref={group} position={[0, 0, 0]}>
      <SpaceshipModel 
        paintScheme={getPaintScheme()} 
        throttle={Math.min(Math.abs(velocity.current.z) / COMBAT_CONFIG.SHIP_MAX_SPEED, 1)}
        isBoosting={keys['ShiftLeft'] || keys['ShiftRight'] || keys['SHIFT']}
        damaged={selfState?.hp !== undefined && selfState.hp < COMBAT_CONFIG.LOW_HP_THRESHOLD}
      />
      {showCombatHitboxes && (
        <mesh>
          <sphereGeometry args={[4.8, 16, 16]} />
          <meshBasicMaterial wireframe color={playerColor === 'blue' ? '#00f0ff' : '#ffe600'} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};
