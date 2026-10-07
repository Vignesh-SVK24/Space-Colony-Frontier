import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipModel } from '../spaceships/SpaceshipModel';
import { SHIP_CONFIG } from '../../../config/shipConfig';
import { COMBAT_CONFIG } from '../../../config/combatConfig';
import { checkObstacleRaycast, resolveShipMovementCollision } from '../../../config/arenaObstacles';
import { SpaceshipPaintSchemeKey } from '../../../config/visualTheme';
import { sendInput, sendBullet, sendLaser, sendSolar } from '../../../multiplayer/colyseusClient';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { nexusAudio } from '../../../utils/nexusAudio';

// Module-scoped scratch objects to eliminate Garbage Collection pauses in 60fps render loop
const _forwardZ = new THREE.Vector3(0, 0, 1);
const _forwardDir = new THREE.Vector3();
const _upDir = new THREE.Vector3(0, 1, 0);
const _prevPos = new THREE.Vector3();
const _moveStep = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();
const _velVec = new THREE.Vector3();
const _normVec = new THREE.Vector3();
const _cameraOffset = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _serverPos = new THREE.Vector3();
const _candPos = new THREE.Vector3();
const _toCand = new THREE.Vector3();
const _candDir = new THREE.Vector3();
const _oppPos = new THREE.Vector3();
const _oppVel = new THREE.Vector3();
const _leadWorld = new THREE.Vector3();
const _muzzlePos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _aimTargetPoint = new THREE.Vector3();
const _aimFireDir = new THREE.Vector3();
const _finalBulletDir = new THREE.Vector3();
const _targetIntercept = new THREE.Vector3();
const _toTargetDir = new THREE.Vector3();
const _beamEnd = new THREE.Vector3();
const _toOpp = new THREE.Vector3();
const _oppDir = new THREE.Vector3();

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
  const matchSessionId = useMultiplayerStore(state => state.matchSessionId);
  
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

  useEffect(() => {
    initialPosSet.current = false;
    velocity.current.set(0, 0, 0);
    rotationEuler.current.set(0, 0, 0, 'YXZ');
    soloAmmo.current = COMBAT_CONFIG.BULLET_MAGAZINE_SIZE;
    soloIsReloading.current = false;
    soloReloadEndTime.current = 0;
    lastBulletTime.current = 0;
    lastLaserTime.current = 0;
    lastSolarTime.current = 0;
    isBoostingRef.current = false;
    setIsBoosting(false);
    isMouseDownLeft.current = false;
    isMouseDownRight.current = false;
    keysRef.current = {};
    if (group.current && selfState) {
      group.current.position.set(selfState.position[0], selfState.position[1], selfState.position[2]);
      rotationEuler.current.set(selfState.rotation[0], selfState.rotation[1], selfState.rotation[2], 'YXZ');
      group.current.quaternion.setFromEuler(rotationEuler.current);
    }
  }, [matchSessionId]);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Initialize position on first spawn or match reset
    if (selfState && !initialPosSet.current) {
      group.current.position.set(selfState.position[0], selfState.position[1], selfState.position[2]);
      rotationEuler.current.set(selfState.rotation[0], selfState.rotation[1], selfState.rotation[2], 'YXZ');
      group.current.quaternion.setFromEuler(rotationEuler.current);
      velocity.current.set(0, 0, 0);

      // Snap camera immediately on initial spawn / rematch
      _cameraOffset.set(0, SHIP_CONFIG.camera.chaseHeight, -SHIP_CONFIG.camera.chaseDistance);
      _cameraOffset.applyEuler(rotationEuler.current);
      camera.position.copy(group.current.position).add(_cameraOffset);
      _forwardDir.copy(_forwardZ).applyEuler(rotationEuler.current);
      _lookTarget.copy(group.current.position).addScaledVector(_forwardDir, 25);
      camera.lookAt(_lookTarget);

      initialPosSet.current = true;
    }

    const dt = Math.min(delta, 0.1);
    const keys = keysRef.current;

    // ==========================================
    // 1. Flight Controls
    // ==========================================
    let forwardInput = 0;
    if (keys['KeyW'] || keys['W']) forwardInput += 1;
    if (keys['KeyS'] || keys['S']) forwardInput -= 1;
    if (keys['ArrowUp'] && !keys['KeyW'] && !keys['W']) forwardInput += 1;
    if (keys['ArrowDown'] && !keys['KeyS'] && !keys['S']) forwardInput -= 0.6;

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
    if (keys['Space'] || keys[' '] || keys['PageUp']) verticalInput += 1;
    if (
      keys['KeyC'] || keys['C'] ||
      keys['ControlLeft'] || keys['ControlRight'] || keys['Control'] || keys['CONTROL'] ||
      keys['KeyZ'] || keys['Z'] ||
      keys['PageDown'] ||
      keys['ArrowDown'] || keys['ARROWDOWN']
    ) {
      verticalInput -= 1;
    }

    const isBoosting = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['SHIFT']);
    const isBraking = !!(keys['KeyX'] || keys['X']);

    // Rotation
    rotationEuler.current.y += yawInput * SHIP_CONFIG.yawSpeed * dt;
    group.current.quaternion.setFromEuler(rotationEuler.current);

    // Forward & Up Directions using scratch vectors
    _forwardDir.copy(_forwardZ).applyEuler(rotationEuler.current);

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

    // Apply translation with continuous collision resolution
    _prevPos.copy(group.current.position);
    _moveStep.copy(_forwardDir).multiplyScalar(velocity.current.z * dt);
    _moveStep.addScaledVector(_upDir, velocity.current.y * dt);
    _desiredPos.copy(_prevPos).add(_moveStep);

    // Continuous collision resolution against all 10 obstacles, planetary terrain, and arena boundary
    const collisionRes = resolveShipMovementCollision(_prevPos, _desiredPos, 3.6);
    group.current.position.set(collisionRes.position.x, collisionRes.position.y, collisionRes.position.z);

    if (collisionRes.collided && collisionRes.normal) {
      _velVec.copy(_forwardDir).multiplyScalar(velocity.current.z).addScaledVector(_upDir, velocity.current.y);
      _normVec.set(collisionRes.normal.x, collisionRes.normal.y, collisionRes.normal.z);
      const normalDot = _velVec.dot(_normVec);
      if (normalDot < 0) {
        _velVec.subScaledVector(_normVec, normalDot * 1.15);
        velocity.current.z = Math.min(velocity.current.z, _velVec.length());
        if (collisionRes.hitTerrain) {
          velocity.current.y = Math.max(0, velocity.current.y);
        }
      }
    }

    // Camera chase
    _cameraOffset.set(0, SHIP_CONFIG.camera.chaseHeight, -SHIP_CONFIG.camera.chaseDistance);
    if (isBoosting) _cameraOffset.z -= 2.0;
    _cameraOffset.applyEuler(rotationEuler.current);

    _targetCamPos.copy(group.current.position).add(_cameraOffset);
    camera.position.lerp(_targetCamPos, SHIP_CONFIG.camera.chaseLag * (dt * 60));

    _lookTarget.copy(group.current.position).addScaledVector(_forwardDir, 25);
    camera.lookAt(_lookTarget);

    const now = performance.now();

    // ==========================================
    // 2. Server Reconciliation (Multiplayer)
    // ==========================================
    if (!isSolo && selfState) {
      _serverPos.set(selfState.position[0], selfState.position[1], selfState.position[2]);
      const posError = group.current.position.distanceTo(_serverPos);
      if (posError > 60.0) {
        group.current.position.copy(_serverPos);
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

    for (let c = 0; c < candidates.length; c++) {
      const cand = candidates[c];
      _candPos.set(cand.position[0], cand.position[1], cand.position[2]);
      _toCand.subVectors(_candPos, group.current.position);
      const dist = _toCand.length();
      if (dist < 280) {
        _candDir.copy(_toCand).normalize();
        const angle = _forwardDir.angleTo(_candDir);
        if (angle < minAngle) {
          minAngle = angle;
          bestTarget = cand;
          bestDist = dist;
        }
      }
    }

    let aimDist = 140;
    if (bestTarget) {
      _oppPos.set(bestTarget.position[0], bestTarget.position[1], bestTarget.position[2]);
      _oppVel.set(bestTarget.velocity[0], bestTarget.velocity[1], bestTarget.velocity[2]);
      const range = Math.floor(bestDist);

      setTargetLock({
        id: bestTarget.id,
        name: bestTarget.name,
        distance: range,
        hp: bestTarget.hp
      });

      if (range < 260) {
        const timeToHit = range / COMBAT_CONFIG.BULLET_SPEED;
        _leadWorld.copy(_oppPos).addScaledVector(_oppVel, timeToHit);
        setLeadIndicator({
          worldPos: [_leadWorld.x, _leadWorld.y, _leadWorld.z],
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
    _muzzlePos.copy(group.current.position).addScaledVector(_forwardDir, 2.2);

    // Camera aim ray & 3D crosshair convergence
    camera.getWorldDirection(_camDir);
    _aimTargetPoint.copy(camera.position).addScaledVector(_camDir, aimDist);
    _aimFireDir.subVectors(_aimTargetPoint, _muzzlePos).normalize();

    // Intelligent Aim Magnetism: Curve plasma stream towards enemy lead spot when aiming near target
    _finalBulletDir.copy(_aimFireDir);
    if (bestTarget && bestDist < COMBAT_CONFIG.AIM_ASSIST_MAX_DIST) {
      _oppPos.set(bestTarget.position[0], bestTarget.position[1], bestTarget.position[2]);
      _oppVel.set(bestTarget.velocity[0], bestTarget.velocity[1], bestTarget.velocity[2]);
      const timeToHit = bestDist / COMBAT_CONFIG.BULLET_SPEED;
      _targetIntercept.copy(_oppPos).addScaledVector(_oppVel, timeToHit);
      _toTargetDir.subVectors(_targetIntercept, _muzzlePos).normalize();

      const angleToTarget = _aimFireDir.angleTo(_toTargetDir);
      if (angleToTarget < COMBAT_CONFIG.AIM_ASSIST_ANGLE) {
        _finalBulletDir.lerp(_toTargetDir, 0.70).normalize();
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
          position: [_muzzlePos.x, _muzzlePos.y, _muzzlePos.z],
          direction: [_finalBulletDir.x, _finalBulletDir.y, _finalBulletDir.z],
          color: playerColor,
          team: 'NONE',
          speed: COMBAT_CONFIG.BULLET_SPEED,
          damage: COMBAT_CONFIG.BULLET_DAMAGE,
          createdAt: Date.now()
        });
        nexusAudio.playLaser();
      } else {
        sendBullet(
          [_muzzlePos.x, _muzzlePos.y, _muzzlePos.z],
          [_finalBulletDir.x, _finalBulletDir.y, _finalBulletDir.z],
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

        _beamEnd.copy(_muzzlePos).addScaledVector(_aimFireDir, COMBAT_CONFIG.LASER_RANGE);

        const raycast = checkObstacleRaycast(
          _muzzlePos.x, _muzzlePos.y, _muzzlePos.z,
          _beamEnd.x, _beamEnd.y, _beamEnd.z
        );

        let actualEnd: [number, number, number];
        let blockedByObstacle = false;

        if (raycast.blocked && raycast.hitPoint) {
          actualEnd = raycast.hitPoint;
          blockedByObstacle = true;
        } else {
          actualEnd = [_beamEnd.x, _beamEnd.y, _beamEnd.z];
        }

        let hitEnemy = false;
        const liveOpp = useMultiplayerStore.getState().opponentState;
        if (liveOpp && liveOpp.alive && liveOpp.hp > 0) {
          _oppPos.set(liveOpp.position[0], liveOpp.position[1], liveOpp.position[2]);
          _toOpp.subVectors(_oppPos, _muzzlePos);
          const oppDist = _toOpp.length();

          if (oppDist <= COMBAT_CONFIG.LASER_RANGE) {
            _oppDir.copy(_toOpp).normalize();
            const angle = _aimFireDir.angleTo(_oppDir);
            const perpDist = oppDist * Math.sin(angle);

            if (angle < COMBAT_CONFIG.LASER_AIM_CONE || perpDist <= COMBAT_CONFIG.BULLET_HITBOX_RADIUS) {
              if (!blockedByObstacle || (raycast.distance > oppDist)) {
                actualEnd = [_oppPos.x, _oppPos.y, _oppPos.z];
                hitEnemy = true;
                blockedByObstacle = false;
              }
            }
          }
        }

        setActiveLaserBeam({
          attackId,
          shooterId: 'solo_player',
          start: [_muzzlePos.x, _muzzlePos.y, _muzzlePos.z],
          end: actualEnd,
          blocked: blockedByObstacle,
          color: playerColor,
          weaponType: 'LASER',
          timestamp: Date.now()
        });

        if (hitEnemy) {
          applyDamageToSoloOpponent(COMBAT_CONFIG.LASER_DAMAGE);
          nexusAudio.playHit();
        }
      } else {
        sendLaser(
          [_muzzlePos.x, _muzzlePos.y, _muzzlePos.z],
          [_aimFireDir.x, _aimFireDir.y, _aimFireDir.z],
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

        _beamEnd.copy(_muzzlePos).addScaledVector(_aimFireDir, COMBAT_CONFIG.SOLAR_RANGE);

        const raycast = checkObstacleRaycast(
          _muzzlePos.x, _muzzlePos.y, _muzzlePos.z,
          _beamEnd.x, _beamEnd.y, _beamEnd.z
        );

        let actualEnd: [number, number, number];
        let blockedByObstacle = false;

        if (raycast.blocked && raycast.hitPoint) {
          actualEnd = raycast.hitPoint;
          blockedByObstacle = true;
        } else {
          actualEnd = [_beamEnd.x, _beamEnd.y, _beamEnd.z];
        }

        let hitEnemy = false;
        const liveOpp = useMultiplayerStore.getState().opponentState;
        if (liveOpp && liveOpp.alive && liveOpp.hp > 0) {
          _oppPos.set(liveOpp.position[0], liveOpp.position[1], liveOpp.position[2]);
          _toOpp.subVectors(_oppPos, _muzzlePos);
          const oppDist = _toOpp.length();

          if (oppDist <= COMBAT_CONFIG.SOLAR_RANGE) {
            _oppDir.copy(_toOpp).normalize();
            const angle = _aimFireDir.angleTo(_oppDir);
            const perpDist = oppDist * Math.sin(angle);

            if (angle < COMBAT_CONFIG.SOLAR_AIM_CONE || perpDist <= COMBAT_CONFIG.BULLET_HITBOX_RADIUS) {
              if (!blockedByObstacle || (raycast.distance > oppDist)) {
                actualEnd = [_oppPos.x, _oppPos.y, _oppPos.z];
                hitEnemy = true;
                blockedByObstacle = false;
              }
            }
          }
        }

        setActiveSolarBeam({
          attackId,
          shooterId: 'solo_player',
          start: [_muzzlePos.x, _muzzlePos.y, _muzzlePos.z],
          end: actualEnd,
          blocked: blockedByObstacle,
          color: playerColor,
          weaponType: 'SOLAR_BEAM',
          timestamp: Date.now()
        });

        if (hitEnemy) {
          applyDamageToSoloOpponent(COMBAT_CONFIG.SOLAR_DAMAGE);
          nexusAudio.playHit();
        }
      } else {
        sendSolar(
          [_muzzlePos.x, _muzzlePos.y, _muzzlePos.z],
          [_aimFireDir.x, _aimFireDir.y, _aimFireDir.z],
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
          [_forwardDir.x * velocity.current.z, _forwardDir.y * velocity.current.z, _forwardDir.z * velocity.current.z],
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
          [_forwardDir.x * velocity.current.z, _forwardDir.y * velocity.current.z, _forwardDir.z * velocity.current.z]
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
