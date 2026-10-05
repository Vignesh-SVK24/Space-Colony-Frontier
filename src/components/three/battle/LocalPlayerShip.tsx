import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipModel } from '../spaceships/SpaceshipModel';
import { SHIP_CONFIG } from '../../../config/shipConfig';
import { COMBAT_CONFIG } from '../../../config/combatConfig';
import { checkObstacleRaycast } from '../../../config/arenaObstacles';
import { SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { sendInput, sendBullet, sendLaser, sendSolar } from '../../../multiplayer/colyseusClient';
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
  const setActiveSolarBeam = useMultiplayerStore(state => state.setActiveSolarBeam);
  const setLaserCooldownRemaining = useMultiplayerStore(state => state.setLaserCooldownRemaining);
  const setSolarCooldownRemaining = useMultiplayerStore(state => state.setSolarCooldownRemaining);
  const setBulletCooldownRemaining = useMultiplayerStore(state => state.setBulletCooldownRemaining);
  const setAmmo = useMultiplayerStore(state => state.setAmmo);
  const setIsReloading = useMultiplayerStore(state => state.setIsReloading);
  const setReloadTimeRemaining = useMultiplayerStore(state => state.setReloadTimeRemaining);
  const setTargetLock = useMultiplayerStore(state => state.setTargetLock);
  const setLeadIndicator = useMultiplayerStore(state => state.setLeadIndicator);
  const showCombatHitboxes = useMultiplayerStore(state => state.showCombatHitboxes);
  
  const keysRef = useRef<Record<string, boolean>>({});
  const [isBoosting, setIsBoosting] = useState(false);
  const isBoostingRef = useRef(false);
  const isMouseDownLeft = useRef(false);
  const isMouseDownRight = useRef(false);
  
  const velocity = useRef(new THREE.Vector3());
  const rotationEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const lastSendTime = useRef(0);
  const lastSoloSyncTime = useRef(0);
  const lastCooldownSyncTime = useRef(0);
  const lastBulletTime = useRef(0);
  const lastLaserTime = useRef(0);
  const lastSolarTime = useRef(0);
  const initialPosSet = useRef(false);

  // Solo mode local weapon state
  const soloAmmo = useRef(COMBAT_CONFIG.BULLET_MAGAZINE_SIZE);
  const soloIsReloading = useRef(false);
  const soloReloadEndTime = useRef(0);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      keysRef.current[e.key.toUpperCase()] = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key.toUpperCase() === 'SHIFT') {
        isBoostingRef.current = true;
        setIsBoosting(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key.toUpperCase()] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key.toUpperCase() === 'SHIFT') {
        isBoostingRef.current = false;
        setIsBoosting(false);
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownLeft.current = true;
      if (e.button === 2) {
        e.preventDefault();
        isMouseDownRight.current = true;
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownLeft.current = false;
      if (e.button === 2) {
        e.preventDefault();
        isMouseDownRight.current = false;
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
    const keys = keysRef.current;

    // ==========================================
    // 1. Flight Controls
    // ==========================================
    let forwardInput = 0;
    if (keys['KeyW'] || keys['ArrowUp'] || keys['W']) forwardInput += 1;
    if (keys['KeyS'] || keys['ArrowDown'] || keys['S']) forwardInput -= 1;

    let yawInput = 0;
    if (keys['KeyA'] || keys['ArrowLeft'] || keys['A']) yawInput += 1;
    if (keys['KeyD'] || keys['ArrowRight'] || keys['D']) yawInput -= 1;

    // Direct proportional analog virtual joystick steering on iOS/Android
    const joy = useMultiplayerStore.getState().joystickAxis;
    if (joy) {
      if (Math.abs(joy.y) > 0.05) forwardInput += joy.y;
      if (Math.abs(joy.x) > 0.05) yawInput -= joy.x;
    }

    let verticalInput = 0;
    if (keys['Space'] || keys[' ']) verticalInput += 1;
    if (keys['KeyC'] || keys['C']) verticalInput -= 1;

    const isBoosting = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['SHIFT']);
    const isBraking = !!(keys['KeyX'] || keys['X']);

    // Rotation
    rotationEuler.current.y += yawInput * SHIP_CONFIG.yawSpeed * dt;
    group.current.quaternion.setFromEuler(rotationEuler.current);

    // Forward Direction
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(rotationEuler.current);
    const upDir = new THREE.Vector3(0, 1, 0);

    // Target Speed
    let targetSpeed = 0;
    if (forwardInput > 0) {
      targetSpeed = isBoosting ? COMBAT_CONFIG.SHIP_BOOST_SPEED : COMBAT_CONFIG.SHIP_MAX_SPEED;
    } else if (forwardInput < 0) {
      targetSpeed = COMBAT_CONFIG.SHIP_MIN_SPEED;
    }

    if (isBraking) {
      targetSpeed = 0;
    }

    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetSpeed, dt * 3.5);
    velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, verticalInput * 25, dt * 4.0);

    // Apply translation
    const moveStep = forwardDir.clone().multiplyScalar(velocity.current.z * dt);
    moveStep.add(upDir.clone().multiplyScalar(velocity.current.y * dt));
    group.current.position.add(moveStep);

    // Arena boundary clamp
    const distFromCenter = group.current.position.length();
    if (distFromCenter > COMBAT_CONFIG.ARENA_RADIUS) {
      group.current.position.setLength(COMBAT_CONFIG.ARENA_RADIUS);
    }

    // Camera chase
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
    // Do NOT pull local ship back towards delayed network echoes (eliminates forward/backward dragging)
    // Only snap on severe respawn/teleport discrepancies
    if (!isSolo && selfState) {
      const serverPos = new THREE.Vector3(...selfState.position);
      const posError = group.current.position.distanceTo(serverPos);

      if (posError > 60.0) {
        group.current.position.copy(serverPos);
      }
    }

    // ==========================================
    // 3. Target Lock & Holographic Lead Indicator
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
      if (dist < 280) {
        const angle = forwardDir.angleTo(toCand.clone().normalize());
        if (angle < minAngle) {
          minAngle = angle;
          bestTarget = cand;
          bestDist = dist;
        }
      }
    }

    let aimDist = 140;
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

      if (range < 260) {
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

      aimDist = Math.max(15, Math.min(280, bestDist));
    } else {
      setTargetLock(null);
      setLeadIndicator(null);
    }

    // ==========================================
    // 4. Weapon Cooldown Timers & Crosshair Ray Convergence
    // ==========================================
    if (isSolo) {
      // Handle solo reloading
      if (soloIsReloading.current) {
        const remaining = Math.max(0, (soloReloadEndTime.current - now) / 1000);
        setReloadTimeRemaining(remaining);
        if (remaining <= 0) {
          soloIsReloading.current = false;
          soloAmmo.current = COMBAT_CONFIG.BULLET_MAGAZINE_SIZE;
          setIsReloading(false);
          setAmmo(COMBAT_CONFIG.BULLET_MAGAZINE_SIZE);
        }
      }
    } else if (selfState) {
      setAmmo(selfState.ammo);
      setIsReloading(selfState.isReloading);
      setReloadTimeRemaining(selfState.reloadTimeRemaining);
    }

    const bulletCdLeft = Math.max(0, COMBAT_CONFIG.BULLET_FIRE_INTERVAL - (now - lastBulletTime.current) / 1000);
    const laserCdLeft = isSolo
      ? Math.max(0, COMBAT_CONFIG.LASER_COOLDOWN - (now - lastLaserTime.current) / 1000)
      : (selfState?.laserCooldownRemaining ?? 0);
    const solarCdLeft = isSolo
      ? Math.max(0, COMBAT_CONFIG.SOLAR_COOLDOWN - (now - lastSolarTime.current) / 1000)
      : (selfState?.solarCooldownRemaining ?? 0);

    // Throttle cooldown updates to HUD to 10Hz or on ready: eliminates 60fps React re-renders!
    if (now - lastCooldownSyncTime.current > 100 || laserCdLeft <= 0.05 || solarCdLeft <= 0.05) {
      lastCooldownSyncTime.current = now;
      setBulletCooldownRemaining(bulletCdLeft);
      setLaserCooldownRemaining(laserCdLeft);
      setSolarCooldownRemaining(solarCdLeft);
    }

    // Muzzle position in world space
    const muzzlePos = group.current.position.clone().add(forwardDir.clone().multiplyScalar(2.2));

    // Camera aim ray & 3D crosshair convergence
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    const aimTargetPoint = camera.position.clone().addScaledVector(camDir, aimDist);
    const aimFireDir = new THREE.Vector3().subVectors(aimTargetPoint, muzzlePos).normalize();

    // Intelligent Aim Magnetism: Magnetically curve plasma stream towards enemy lead spot when aiming near target!
    let finalBulletDir = aimFireDir.clone();
    if (bestTarget && bestDist < COMBAT_CONFIG.AIM_ASSIST_MAX_DIST) {
      const oppPos = new THREE.Vector3(...bestTarget.position);
      const oppVel = new THREE.Vector3(...bestTarget.velocity);
      const timeToHit = bestDist / COMBAT_CONFIG.BULLET_SPEED;
      const targetIntercept = oppPos.clone().add(oppVel.clone().multiplyScalar(timeToHit));
      const toTargetDir = new THREE.Vector3().subVectors(targetIntercept, muzzlePos).normalize();

      const angleToTarget = aimFireDir.angleTo(toTargetDir);
      if (angleToTarget < COMBAT_CONFIG.AIM_ASSIST_ANGLE) {
        finalBulletDir.lerp(toTargetDir, 0.70).normalize();
      }
    }

    // ==========================================
    // 5. Weapon 1: Rapid Plasma Bullet (2 HP, 0.1s rate, 30 magazine, 2s reload)
    // ==========================================
    const shootBullet = isMouseDownLeft.current || keys['KeyJ'] || keys['J'];
    const canFireBullet = isSolo
      ? (!soloIsReloading.current && soloAmmo.current > 0)
      : (selfState && !selfState.isReloading && selfState.ammo > 0);

    if (shootBullet && canFireBullet && now - lastBulletTime.current > COMBAT_CONFIG.BULLET_FIRE_INTERVAL * 1000) {
      lastBulletTime.current = now;
      const attackId = `BULLET_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      if (isSolo) {
        soloAmmo.current -= 1;
        setAmmo(soloAmmo.current);
        if (soloAmmo.current <= 0) {
          soloIsReloading.current = true;
          soloReloadEndTime.current = now + COMBAT_CONFIG.BULLET_RELOAD_TIME * 1000;
          setIsReloading(true);
        }

        addSoloProjectile({
          id: attackId,
          attackId,
          ownerId: 'solo_player',
          weaponType: 'BULLET',
          position: [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          direction: [finalBulletDir.x, finalBulletDir.y, finalBulletDir.z],
          color: playerColor,
          team: 'NONE',
          speed: COMBAT_CONFIG.BULLET_SPEED,
          damage: COMBAT_CONFIG.BULLET_DAMAGE,
          createdAt: Date.now()
        });
        nexusAudio.playLaser();
      } else {
        sendBullet(
          [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          [finalBulletDir.x, finalBulletDir.y, finalBulletDir.z],
          attackId
        );
        nexusAudio.playLaser();
      }
    }

    // ==========================================
    // 6. Weapon 2: Directed Laser Beam (12 HP, 3.0s RECHARGE)
    // ==========================================
    const shootLaser = isMouseDownRight.current || keys['KeyK'] || keys['K'];
    if (shootLaser && laserCdLeft <= 0.05) {
      lastLaserTime.current = now;
      const attackId = `LASER_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (isSolo) {
        nexusAudio.playLaser();

        const emitterPos = muzzlePos.clone();
        const maxBeamEnd = emitterPos.clone().add(aimFireDir.clone().multiplyScalar(COMBAT_CONFIG.LASER_RANGE));

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

        let hitEnemy = false;
        const liveOpp = useMultiplayerStore.getState().opponentState;
        if (liveOpp && liveOpp.alive && liveOpp.hp > 0) {
          const oppPos = new THREE.Vector3(...liveOpp.position);
          const toOpp = new THREE.Vector3().subVectors(oppPos, emitterPos);
          const oppDist = toOpp.length();

          if (oppDist <= COMBAT_CONFIG.LASER_RANGE) {
            const oppDir = toOpp.clone().normalize();
            const angle = aimFireDir.angleTo(oppDir);
            const perpDist = oppDist * Math.sin(angle);

            if (angle < COMBAT_CONFIG.LASER_AIM_CONE || perpDist <= COMBAT_CONFIG.BULLET_HITBOX_RADIUS) {
              if (!blockedByObstacle || (raycast.distance > oppDist)) {
                actualEnd = [oppPos.x, oppPos.y, oppPos.z];
                hitEnemy = true;
                blockedByObstacle = false;
              }
            }
          }
        }

        setActiveLaserBeam({
          attackId,
          shooterId: 'solo_player',
          start: [emitterPos.x, emitterPos.y, emitterPos.z],
          end: actualEnd,
          blocked: blockedByObstacle,
          color: playerColor,
          weaponType: 'LASER',
          timestamp: Date.now()
        });

        if (hitEnemy) {
          applyDamageToSoloOpponent(COMBAT_CONFIG.LASER_DAMAGE); // Exactly 12 HP
          nexusAudio.playHit();
        }
      } else {
        sendLaser(
          [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          [aimFireDir.x, aimFireDir.y, aimFireDir.z],
          attackId
        );
      }
    }

    // ==========================================
    // 7. Weapon 3: Special High-Yield Solar Beam (30 HP, 10.0s RECHARGE)
    // ==========================================
    const shootSolar = keys['KeyL'];
    if (shootSolar && solarCdLeft <= 0.05) {
      lastSolarTime.current = now;
      const attackId = `SOLAR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (isSolo) {
        nexusAudio.playLaser();

        const emitterPos = muzzlePos.clone();
        const maxBeamEnd = emitterPos.clone().add(aimFireDir.clone().multiplyScalar(COMBAT_CONFIG.SOLAR_RANGE));

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

        let hitEnemy = false;
        const liveOpp = useMultiplayerStore.getState().opponentState;
        if (liveOpp && liveOpp.alive && liveOpp.hp > 0) {
          const oppPos = new THREE.Vector3(...liveOpp.position);
          const toOpp = new THREE.Vector3().subVectors(oppPos, emitterPos);
          const oppDist = toOpp.length();

          if (oppDist <= COMBAT_CONFIG.SOLAR_RANGE) {
            const oppDir = toOpp.clone().normalize();
            const angle = aimFireDir.angleTo(oppDir);
            const perpDist = oppDist * Math.sin(angle);

            if (angle < COMBAT_CONFIG.SOLAR_AIM_CONE || perpDist <= COMBAT_CONFIG.BULLET_HITBOX_RADIUS) {
              if (!blockedByObstacle || (raycast.distance > oppDist)) {
                actualEnd = [oppPos.x, oppPos.y, oppPos.z];
                hitEnemy = true;
                blockedByObstacle = false;
              }
            }
          }
        }

        setActiveSolarBeam({
          attackId,
          shooterId: 'solo_player',
          start: [emitterPos.x, emitterPos.y, emitterPos.z],
          end: actualEnd,
          blocked: blockedByObstacle,
          color: playerColor,
          weaponType: 'SOLAR_BEAM',
          timestamp: Date.now()
        });

        if (hitEnemy) {
          applyDamageToSoloOpponent(COMBAT_CONFIG.SOLAR_DAMAGE); // Exactly 30 HP
          nexusAudio.playHit();
        }
      } else {
        sendSolar(
          [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          [aimFireDir.x, aimFireDir.y, aimFireDir.z],
          attackId
        );
      }
    }

    // ==========================================
    // 8. Flight State Sync / Telemetry (Throttled to 30Hz)
    // ==========================================
    if (isSolo) {
      if (now - lastSoloSyncTime.current > 33) {
        lastSoloSyncTime.current = now;
        updateSoloSelf(
          [group.current.position.x, group.current.position.y, group.current.position.z],
          [rotationEuler.current.x, rotationEuler.current.y, rotationEuler.current.z],
          [forwardDir.x * velocity.current.z, forwardDir.y * velocity.current.z, forwardDir.z * velocity.current.z],
          useMultiplayerStore.getState().selfState?.hp ?? COMBAT_CONFIG.MAX_HP,
          isBoosting,
          Math.min(Math.abs(velocity.current.z) / COMBAT_CONFIG.SHIP_MAX_SPEED, 1)
        );
      }
    } else {
      if (now - lastSendTime.current > 33) {
        sendInput(
          [group.current.position.x, group.current.position.y, group.current.position.z],
          [rotationEuler.current.x, rotationEuler.current.y, rotationEuler.current.z],
          [forwardDir.x * velocity.current.z, forwardDir.y * velocity.current.z, forwardDir.z * velocity.current.z]
        );
        lastSendTime.current = now;
      }
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <SpaceshipModel 
        paintScheme={getPaintScheme()} 
        throttle={Math.min(Math.abs(velocity.current.z) / COMBAT_CONFIG.SHIP_MAX_SPEED, 1)}
        isBoosting={isBoosting}
        damaged={selfState?.hp !== undefined && selfState.hp < COMBAT_CONFIG.LOW_HP_THRESHOLD}
      />
      {showCombatHitboxes && (
        <mesh>
          <sphereGeometry args={[COMBAT_CONFIG.BULLET_HITBOX_RADIUS, 16, 16]} />
          <meshBasicMaterial wireframe color={playerColor === 'blue' ? '#00f0ff' : '#ffe600'} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};
