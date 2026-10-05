import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { ProjectileState } from '../../../multiplayer/types';
import { nexusAudio } from '../../../utils/nexusAudio';
import { COMBAT_CONFIG, AI_DIFFICULTY_SETTINGS } from '../../../config/combatConfig';
import { ARENA_OBSTACLES, checkObstacleRaycast, getCoverHidingPosition } from '../../../config/arenaObstacles';

export type AIState =
  | 'IDLE'
  | 'PATROL'
  | 'SEARCH'
  | 'APPROACH'
  | 'TRACK'
  | 'ATTACK'
  | 'EVADE'
  | 'TAKE_COVER'
  | 'REPOSITION'
  | 'RETREAT'
  | 'RECOVER'
  | 'PURSUIT'
  | 'DESTROYED';

const PATROL_WAYPOINTS: [number, number, number][] = [
  [60, 15, -60],
  [-70, -10, 50],
  [50, -18, 70],
  [-60, 20, -50]
];

function distancePointToSegment(point: THREE.Vector3, start: THREE.Vector3, end: THREE.Vector3): number {
  const seg = end.clone().sub(start);
  const segLenSq = seg.lengthSq();
  if (segLenSq === 0) return point.distanceTo(start);
  const t = Math.max(0, Math.min(1, point.clone().sub(start).dot(seg) / segLenSq));
  const proj = start.clone().addScaledVector(seg, t);
  return point.distanceTo(proj);
}

export const SoloAIBot: React.FC = () => {
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const aiDifficulty = useMultiplayerStore(state => state.aiDifficulty);

  const updateSoloOpponent = useMultiplayerStore(state => state.updateSoloOpponent);
  const addSoloProjectile = useMultiplayerStore(state => state.addSoloProjectile);
  const setProjectiles = useMultiplayerStore(state => state.setProjectiles);
  const applyDamageToSoloPlayer = useMultiplayerStore(state => state.applyDamageToSoloPlayer);
  const applyDamageToSoloOpponent = useMultiplayerStore(state => state.applyDamageToSoloOpponent);
  const setActiveLaserBeam = useMultiplayerStore(state => state.setActiveLaserBeam);
  const setActiveSolarBeam = useMultiplayerStore(state => state.setActiveSolarBeam);
  const handleMatchEnd = useMultiplayerStore(state => state.handleMatchEnd);

  // AI physical transform refs
  const dronePos = useRef(new THREE.Vector3(0, 10, 80));
  const droneEuler = useRef(new THREE.Euler(0, Math.PI, 0, 'YXZ'));
  const droneQuat = useRef(new THREE.Quaternion().setFromEuler(droneEuler.current));
  const droneVel = useRef(new THREE.Vector3(0, 0, 15));

  // AI state machine refs
  const currentState = useRef<AIState>('IDLE');
  const lastStateChange = useRef(0);
  const currentWaypointIndex = useRef(0);
  const evasionVector = useRef(new THREE.Vector3());
  const evasionEndTime = useRef(0);
  const targetCoverPoint = useRef<[number, number, number] | null>(null);

  // Weapon timers & ammunition (Respects 30 ammo, 2s reload, 3s laser, 10s solar)
  const lastBulletTime = useRef(0);
  const lastLaserTime = useRef(0);
  const lastSolarTime = useRef(0);
  const aiAmmo = useRef(COMBAT_CONFIG.BULLET_MAGAZINE_SIZE);
  const aiIsReloading = useRef(false);
  const aiReloadEndTime = useRef(0);

  const matchStartTime = useRef(Date.now());
  const matchEnded = useRef(false);

  // Stats tracking
  const totalShotsFired = useRef(0);
  const totalShotsHit = useRef(0);
  const lastOpponentSyncTime = useRef(0);

  useFrame((state, delta) => {
    const liveOpponent = useMultiplayerStore.getState().opponentState;
    const liveSelf = useMultiplayerStore.getState().selfState;
    if (!isSolo || !liveSelf || !liveOpponent || matchEnded.current) return;

    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const settings = AI_DIFFICULTY_SETTINGS[aiDifficulty] || AI_DIFFICULTY_SETTINGS.NORMAL;
    const playerPos = new THREE.Vector3(...liveSelf.position);
    const toPlayer = new THREE.Vector3().subVectors(playerPos, dronePos.current);
    const distToPlayer = toPlayer.length();

    // Line of sight check between Bot and Player
    const los = checkObstacleRaycast(
      dronePos.current.x, dronePos.current.y, dronePos.current.z,
      playerPos.x, playerPos.y, playerPos.z
    );
    const hasLineOfSight = !los.blocked;

    // Check if destroyed
    if (liveOpponent.hp <= 0 && currentState.current !== 'DESTROYED') {
      currentState.current = 'DESTROYED';
      lastStateChange.current = now;
      nexusAudio.playHit();
    }

    // =========================================================================
    // 1. AI STATE MACHINE TRANSITIONS
    // =========================================================================
    const timeInState = now - lastStateChange.current;

    switch (currentState.current) {
      case 'DESTROYED': {
        droneEuler.current.x += dt * 3.0;
        droneEuler.current.y += dt * 2.0;
        droneEuler.current.z += dt * 4.0;
        droneQuat.current.setFromEuler(droneEuler.current);
        droneVel.current.multiplyScalar(0.95);
        dronePos.current.addScaledVector(droneVel.current, dt);

        if (timeInState > 2.0 && !matchEnded.current) {
          matchEnded.current = true;
          const duration = Math.floor((Date.now() - matchStartTime.current) / 1000);
          handleMatchEnd({
            winner: 'solo_player',
            winnerName: liveSelf.name || 'Ace Pilot',
            loserName: liveOpponent.name || 'AI Drone',
            mode: '1v1',
            damageDealt: COMBAT_CONFIG.MAX_HP - liveOpponent.hp,
            shotsHit: Math.max(1, totalShotsHit.current),
            shotsFired: Math.max(1, totalShotsFired.current),
            accuracy: Math.round((totalShotsHit.current / Math.max(1, totalShotsFired.current)) * 100),
            matchDuration: duration
          });
          nexusAudio.playVictory();
        }
        break;
      }

      case 'IDLE': {
        if (hasLineOfSight && distToPlayer < 240) {
          currentState.current = 'APPROACH';
          lastStateChange.current = now;
        } else if (timeInState > 1.2) {
          currentState.current = 'PATROL';
          lastStateChange.current = now;
        }
        break;
      }

      case 'PATROL': {
        const wp = PATROL_WAYPOINTS[currentWaypointIndex.current];
        const wpVec = new THREE.Vector3(...wp);
        const distToWp = dronePos.current.distanceTo(wpVec);

        if (distToWp < 15) {
          currentWaypointIndex.current = (currentWaypointIndex.current + 1) % PATROL_WAYPOINTS.length;
          currentState.current = 'SEARCH';
          lastStateChange.current = now;
        } else if (hasLineOfSight && distToPlayer < 200) {
          currentState.current = 'APPROACH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'SEARCH': {
        if (hasLineOfSight) {
          currentState.current = 'APPROACH';
          lastStateChange.current = now;
        } else if (timeInState > 2.5) {
          currentState.current = 'PATROL';
          lastStateChange.current = now;
        }
        break;
      }

      case 'APPROACH': {
        if (liveOpponent.hp < settings.retreatHpThreshold) {
          currentState.current = 'TAKE_COVER';
          lastStateChange.current = now;
        } else if (distToPlayer < 90 && hasLineOfSight) {
          currentState.current = 'TRACK';
          lastStateChange.current = now;
        }
        break;
      }

      case 'TRACK': {
        if (!hasLineOfSight) {
          currentState.current = 'PURSUIT';
          lastStateChange.current = now;
        } else if (timeInState > settings.reactionDelay) {
          currentState.current = 'ATTACK';
          lastStateChange.current = now;
        }
        break;
      }

      case 'ATTACK': {
        if (!hasLineOfSight) {
          currentState.current = 'PURSUIT';
          lastStateChange.current = now;
        } else if (liveOpponent.hp < settings.retreatHpThreshold) {
          currentState.current = 'TAKE_COVER';
          lastStateChange.current = now;
        } else if (timeInState > 3.5) {
          currentState.current = 'REPOSITION';
          lastStateChange.current = now;
        }
        break;
      }

      case 'EVADE': {
        if (now > evasionEndTime.current) {
          currentState.current = hasLineOfSight ? 'ATTACK' : 'SEARCH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'TAKE_COVER': {
        if (!targetCoverPoint.current) {
          const coverData = getCoverHidingPosition(
            [dronePos.current.x, dronePos.current.y, dronePos.current.z],
            [playerPos.x, playerPos.y, playerPos.z]
          );
          if (coverData) {
            targetCoverPoint.current = coverData.position;
          } else {
            currentState.current = 'RETREAT';
            lastStateChange.current = now;
            break;
          }
        }

        const distToCover = dronePos.current.distanceTo(new THREE.Vector3(...targetCoverPoint.current));
        if (distToCover < 12 || !hasLineOfSight) {
          currentState.current = 'RECOVER';
          lastStateChange.current = now;
        }
        break;
      }

      case 'RECOVER': {
        if (timeInState > 4.0 || liveOpponent.hp > settings.retreatHpThreshold + 20) {
          targetCoverPoint.current = null;
          currentState.current = 'SEARCH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'REPOSITION': {
        if (timeInState > 2.0) {
          currentState.current = hasLineOfSight ? 'ATTACK' : 'APPROACH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'RETREAT': {
        if (distToPlayer > 180 || !hasLineOfSight) {
          currentState.current = 'SEARCH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'PURSUIT': {
        if (hasLineOfSight && distToPlayer < 120) {
          currentState.current = 'ATTACK';
          lastStateChange.current = now;
        } else if (timeInState > 4.5) {
          currentState.current = 'SEARCH';
          lastStateChange.current = now;
        }
        break;
      }
    }

    // =========================================================================
    // 2. STEERING & MOVEMENT EXECUTION
    // =========================================================================
    if (currentState.current !== 'DESTROYED') {
      let desiredSpeed = 24;
      const targetMovePos = new THREE.Vector3();

      switch (currentState.current) {
        case 'PATROL': {
          desiredSpeed = 22;
          const wp = PATROL_WAYPOINTS[currentWaypointIndex.current];
          targetMovePos.set(wp[0], wp[1], wp[2]);
          break;
        }
        case 'SEARCH': {
          desiredSpeed = 16;
          targetMovePos.copy(dronePos.current).add(new THREE.Vector3(Math.sin(now) * 20, 0, Math.cos(now) * 20));
          break;
        }
        case 'APPROACH': {
          desiredSpeed = 38;
          targetMovePos.copy(playerPos);
          break;
        }
        case 'TRACK': {
          desiredSpeed = 26;
          const orbitAngle = now * 0.6;
          targetMovePos.set(
            playerPos.x + Math.sin(orbitAngle) * 55,
            playerPos.y + Math.sin(now * 1.2) * 10 + 4,
            playerPos.z + Math.cos(orbitAngle) * 55
          );
          break;
        }
        case 'ATTACK': {
          desiredSpeed = 18;
          const attackOffset = toPlayer.clone().normalize().multiplyScalar(-40);
          targetMovePos.copy(playerPos).add(attackOffset);
          break;
        }
        case 'EVADE': {
          desiredSpeed = 44;
          targetMovePos.copy(dronePos.current).add(evasionVector.current);
          break;
        }
        case 'TAKE_COVER': {
          desiredSpeed = 40;
          if (targetCoverPoint.current) {
            targetMovePos.set(...targetCoverPoint.current);
          }
          break;
        }
        case 'RECOVER': {
          desiredSpeed = 10;
          if (targetCoverPoint.current) {
            targetMovePos.set(...targetCoverPoint.current);
          }
          break;
        }
        case 'REPOSITION': {
          desiredSpeed = 32;
          const rightVector = toPlayer.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
          targetMovePos.copy(dronePos.current).addScaledVector(rightVector, 35);
          break;
        }
        case 'RETREAT': {
          desiredSpeed = 48;
          targetMovePos.copy(dronePos.current).addScaledVector(toPlayer.clone().normalize(), -80);
          break;
        }
        case 'PURSUIT': {
          desiredSpeed = 46;
          targetMovePos.copy(playerPos);
          break;
        }
      }

      if (targetMovePos.length() > COMBAT_CONFIG.ARENA_RADIUS - 40) {
        targetMovePos.clampLength(0, COMBAT_CONFIG.ARENA_RADIUS - 45);
      }

      const steerDir = new THREE.Vector3().subVectors(targetMovePos, dronePos.current).normalize();
      droneVel.current.lerp(steerDir.multiplyScalar(desiredSpeed), dt * 2.5);
      dronePos.current.addScaledVector(droneVel.current, dt);

      if (dronePos.current.length() > COMBAT_CONFIG.ARENA_RADIUS - 10) {
        dronePos.current.clampLength(0, COMBAT_CONFIG.ARENA_RADIUS - 12);
        droneVel.current.multiplyScalar(0.5);
      }

      let aimTarget = playerPos;
      if (currentState.current === 'PATROL' || currentState.current === 'SEARCH') {
        aimTarget = targetMovePos;
      }

      const lookMat = new THREE.Matrix4().lookAt(dronePos.current, aimTarget, new THREE.Vector3(0, 1, 0));
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMat);
      droneQuat.current.slerp(targetQuat, dt * 4.0);
      droneEuler.current.setFromQuaternion(droneQuat.current, 'YXZ');

      if (now - lastOpponentSyncTime.current > 0.033) {
        lastOpponentSyncTime.current = now;
        updateSoloOpponent(
          [dronePos.current.x, dronePos.current.y, dronePos.current.z],
          [droneEuler.current.x, droneEuler.current.y, droneEuler.current.z],
          [droneVel.current.x, droneVel.current.y, droneVel.current.z],
          liveOpponent.hp,
          desiredSpeed > 35,
          desiredSpeed / 48
        );
      }
    }

    // =========================================================================
    // 3. WEAPON SYSTEMS (BULLET, LASER, SOLAR BEAM)
    // =========================================================================
    // AI Ammo Reload Handling (30 magazine, 2s reload)
    if (aiIsReloading.current) {
      if (now > aiReloadEndTime.current) {
        aiIsReloading.current = false;
        aiAmmo.current = COMBAT_CONFIG.BULLET_MAGAZINE_SIZE;
      }
    }

    if (currentState.current === 'ATTACK' && hasLineOfSight && distToPlayer < 220) {
      const droneForward = new THREE.Vector3(0, 0, 1).applyQuaternion(droneQuat.current).normalize();

      // --- WEAPON 3: SOLAR BEAM (30 HP, 10s Recharge) ---
      if (
        settings.useSolar &&
        now - lastSolarTime.current > COMBAT_CONFIG.SOLAR_COOLDOWN &&
        distToPlayer < COMBAT_CONFIG.SOLAR_RANGE
      ) {
        lastSolarTime.current = now;
        nexusAudio.playLaser();

        const emitterPos = dronePos.current.clone().add(droneForward.clone().multiplyScalar(2.0));
        const solarRay = checkObstacleRaycast(
          emitterPos.x, emitterPos.y, emitterPos.z,
          playerPos.x, playerPos.y, playerPos.z
        );

        let beamEnd: [number, number, number] = [playerPos.x, playerPos.y, playerPos.z];
        let blocked = false;

        if (solarRay.blocked && solarRay.hitPoint) {
          beamEnd = solarRay.hitPoint;
          blocked = true;
        } else {
          applyDamageToSoloPlayer(COMBAT_CONFIG.SOLAR_DAMAGE); // Exactly 30 HP
          nexusAudio.playWarning();
        }

        setActiveSolarBeam({
          attackId: `ai_solar_${Date.now()}`,
          shooterId: 'solo_ai_drone',
          start: [emitterPos.x, emitterPos.y, emitterPos.z],
          end: beamEnd,
          blocked,
          color: liveOpponent.color || 'red',
          weaponType: 'SOLAR_BEAM',
          timestamp: Date.now()
        });
      }

      // --- WEAPON 2: LASER BEAM (12 HP, 3s Recharge) ---
      if (
        settings.useLaser &&
        now - lastLaserTime.current > COMBAT_CONFIG.LASER_COOLDOWN &&
        distToPlayer < COMBAT_CONFIG.LASER_RANGE
      ) {
        lastLaserTime.current = now;
        nexusAudio.playLaser();

        const emitterPos = dronePos.current.clone().add(droneForward.clone().multiplyScalar(2.0));
        const laserRay = checkObstacleRaycast(
          emitterPos.x, emitterPos.y, emitterPos.z,
          playerPos.x, playerPos.y, playerPos.z
        );

        let beamEnd: [number, number, number] = [playerPos.x, playerPos.y, playerPos.z];
        let blocked = false;

        if (laserRay.blocked && laserRay.hitPoint) {
          beamEnd = laserRay.hitPoint;
          blocked = true;
        } else {
          applyDamageToSoloPlayer(COMBAT_CONFIG.LASER_DAMAGE); // Exactly 12 HP
          nexusAudio.playWarning();
        }

        setActiveLaserBeam({
          attackId: `ai_laser_${Date.now()}`,
          shooterId: 'solo_ai_drone',
          start: [emitterPos.x, emitterPos.y, emitterPos.z],
          end: beamEnd,
          blocked,
          color: liveOpponent.color || 'red',
          weaponType: 'LASER',
          timestamp: Date.now()
        });
      }

      // --- WEAPON 1: PLASMA BULLET (2 HP, 0.1s rate, 30 ammo, 2s reload) ---
      if (!aiIsReloading.current && aiAmmo.current > 0 && now - lastBulletTime.current > settings.firingInterval) {
        lastBulletTime.current = now;
        aiAmmo.current -= 1;
        if (aiAmmo.current <= 0) {
          aiIsReloading.current = true;
          aiReloadEndTime.current = now + COMBAT_CONFIG.BULLET_RELOAD_TIME;
        }

        const fireDir = new THREE.Vector3().subVectors(playerPos, dronePos.current).normalize();
        fireDir.x += (Math.random() - 0.5) * settings.accuracySpread;
        fireDir.y += (Math.random() - 0.5) * settings.accuracySpread;
        fireDir.z += (Math.random() - 0.5) * settings.accuracySpread;
        fireDir.normalize();

        const bulletVel = fireDir.clone().multiplyScalar(COMBAT_CONFIG.BULLET_SPEED);
        addSoloProjectile({
          id: `ai_bullet_${Math.random()}`,
          attackId: `AI_BULLET_${Date.now()}`,
          ownerId: 'solo_ai_drone',
          weaponType: 'BULLET',
          position: [dronePos.current.x, dronePos.current.y, dronePos.current.z],
          direction: [bulletVel.x, bulletVel.y, bulletVel.z],
          color: liveOpponent.color || 'red',
          team: 'NONE',
          speed: COMBAT_CONFIG.BULLET_SPEED,
          damage: COMBAT_CONFIG.BULLET_DAMAGE,
          createdAt: Date.now()
        });
        nexusAudio.playLaser();
      }
    }

    // =========================================================================
    // 4. PROJECTILE COLLISION & OBSTACLE BLOCKING
    // =========================================================================
    const updatedProjectiles: ProjectileState[] = [];
    const currentProjs = useMultiplayerStore.getState().projectiles;

    for (const proj of currentProjs) {
      const prevPos = new THREE.Vector3(...proj.position);
      const projDir = new THREE.Vector3(...proj.direction).normalize();
      const nextPos = prevPos.clone().addScaledVector(projDir, COMBAT_CONFIG.BULLET_SPEED * dt);

      if (Date.now() - proj.createdAt > 2200 || nextPos.length() > COMBAT_CONFIG.ARENA_RADIUS) {
        continue;
      }

      let hit = false;

      // 1. Obstacle swept collision
      for (const obs of ARENA_OBSTACLES) {
        const obsPos = new THREE.Vector3(...obs.position);
        if (distancePointToSegment(obsPos, prevPos, nextPos) < obs.radius) {
          hit = true;
          break;
        }
      }

      if (hit) continue;

      // 2. Collision against Player
      if (proj.ownerId === 'solo_ai_drone') {
        const distToPlayer = distancePointToSegment(playerPos, prevPos, nextPos);
        if (distToPlayer <= COMBAT_CONFIG.BULLET_HITBOX_RADIUS) {
          hit = true;
          applyDamageToSoloPlayer(COMBAT_CONFIG.BULLET_DAMAGE); // Exactly 2 HP
          nexusAudio.playWarning();
        }
      }

      // 3. Collision against AI Drone
      if (proj.ownerId === 'solo_player') {
        const distToDrone = distancePointToSegment(dronePos.current, prevPos, nextPos);
        if (distToDrone <= COMBAT_CONFIG.BULLET_HITBOX_RADIUS) {
          hit = true;
          totalShotsHit.current++;
          applyDamageToSoloOpponent(COMBAT_CONFIG.BULLET_DAMAGE); // Exactly 2 HP
          nexusAudio.playHit();

          if (Math.random() < settings.evasionChance && currentState.current !== 'DESTROYED') {
            currentState.current = 'EVADE';
            lastStateChange.current = now;
            evasionEndTime.current = now + 1.2;
            evasionVector.current.set(
              (Math.random() - 0.5) * 45,
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 45
            );
          }
        }
      }

      if (!hit) {
        updatedProjectiles.push({
          ...proj,
          position: [nextPos.x, nextPos.y, nextPos.z]
        });
      }
    }

    if (currentProjs.length > 0 || updatedProjectiles.length > 0) {
      setProjectiles(updatedProjectiles);
    }

    // =========================================================================
    // 5. PLAYER DEFEAT RESOLUTION
    // =========================================================================
    if (liveSelf.hp <= 0 && !matchEnded.current) {
      matchEnded.current = true;
      const duration = Math.floor((Date.now() - matchStartTime.current) / 1000);
      handleMatchEnd({
        winner: 'solo_ai_drone',
        winnerName: liveOpponent.name || 'AI Drone',
        loserName: liveSelf.name || 'Ace Pilot',
        mode: '1v1',
        damageDealt: Math.max(0, COMBAT_CONFIG.MAX_HP - liveOpponent.hp),
        shotsHit: totalShotsHit.current,
        shotsFired: Math.max(1, totalShotsFired.current),
        accuracy: Math.round((totalShotsHit.current / Math.max(1, totalShotsFired.current)) * 100),
        matchDuration: duration
      });
    }
  });

  return null;
};
