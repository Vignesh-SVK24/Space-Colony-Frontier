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

// Arena patrol waypoints
const PATROL_WAYPOINTS: [number, number, number][] = [
  [60, 15, -60],
  [-70, -10, 50],
  [50, -18, 70],
  [-60, 20, -50]
];

export const SoloAIBot: React.FC = () => {
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const aiDifficulty = useMultiplayerStore(state => state.aiDifficulty);
  const selfState = useMultiplayerStore(state => state.selfState);
  const opponentState = useMultiplayerStore(state => state.opponentState);
  const projectiles = useMultiplayerStore(state => state.projectiles);

  const updateSoloOpponent = useMultiplayerStore(state => state.updateSoloOpponent);
  const addSoloProjectile = useMultiplayerStore(state => state.addSoloProjectile);
  const setProjectiles = useMultiplayerStore(state => state.setProjectiles);
  const applyDamageToSoloPlayer = useMultiplayerStore(state => state.applyDamageToSoloPlayer);
  const applyDamageToSoloOpponent = useMultiplayerStore(state => state.applyDamageToSoloOpponent);
  const setActiveLaserBeam = useMultiplayerStore(state => state.setActiveLaserBeam);
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

  // Weapon timers
  const lastBulletTime = useRef(0);
  const lastLaserTime = useRef(0);
  const matchStartTime = useRef(Date.now());
  const matchEnded = useRef(false);

  // Stats tracking for victory / defeat
  const totalShotsFired = useRef(0);
  const totalShotsHit = useRef(0);

  useFrame((state, delta) => {
    if (!isSolo || !selfState || !opponentState || matchEnded.current) return;

    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const settings = AI_DIFFICULTY_SETTINGS[aiDifficulty] || AI_DIFFICULTY_SETTINGS.NORMAL;
    const playerPos = new THREE.Vector3(...selfState.position);
    const toPlayer = new THREE.Vector3().subVectors(playerPos, dronePos.current);
    const distToPlayer = toPlayer.length();

    // Line of sight check between Bot and Player
    const los = checkObstacleRaycast(
      dronePos.current.x, dronePos.current.y, dronePos.current.z,
      playerPos.x, playerPos.y, playerPos.z
    );
    const hasLineOfSight = !los.blocked;

    // Check if destroyed
    if (opponentState.hp <= 0 && currentState.current !== 'DESTROYED') {
      currentState.current = 'DESTROYED';
      lastStateChange.current = now;
      nexusAudio.playHit();
    }

    // =========================================================================
    // 1. AI 13-STATE MACHINE TRANSITIONS
    // =========================================================================
    const timeInState = now - lastStateChange.current;

    switch (currentState.current) {
      case 'DESTROYED': {
        // Tumble and spin out of control
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
            winnerName: selfState.name || 'Ace Pilot',
            loserName: opponentState.name || 'AI Drone',
            damageDealt: 100,
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
        // Sensor check
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
        // Waypoint navigation
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
        // Sweep sensors for player
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
        // Closing the distance
        if (opponentState.hp <= settings.coverHealthThreshold) {
          currentState.current = 'TAKE_COVER';
          lastStateChange.current = now;
        } else if (distToPlayer < 75) {
          currentState.current = 'TRACK';
          lastStateChange.current = now;
        } else if (!hasLineOfSight && timeInState > 4.0) {
          currentState.current = 'SEARCH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'TRACK': {
        // Circling, aiming, keeping target locked
        if (opponentState.hp <= settings.coverHealthThreshold) {
          currentState.current = 'TAKE_COVER';
          lastStateChange.current = now;
        } else if (distToPlayer > 130) {
          currentState.current = 'PURSUIT';
          lastStateChange.current = now;
        } else if (!hasLineOfSight) {
          currentState.current = 'REPOSITION';
          lastStateChange.current = now;
        } else if (timeInState > settings.reactionTime && hasLineOfSight && distToPlayer < 100) {
          currentState.current = 'ATTACK';
          lastStateChange.current = now;
        }
        break;
      }

      case 'ATTACK': {
        // Weapon attack phase
        if (opponentState.hp <= settings.coverHealthThreshold) {
          currentState.current = 'TAKE_COVER';
          lastStateChange.current = now;
        } else if (!hasLineOfSight) {
          currentState.current = 'REPOSITION';
          lastStateChange.current = now;
        } else if (timeInState > 1.4) {
          // After attack burst, either evade or resume tracking
          if (Math.random() < settings.evasionChance) {
            currentState.current = 'EVADE';
            evasionEndTime.current = now + 1.2;
            evasionVector.current.set(
              (Math.random() - 0.5) * 45,
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 45
            );
          } else {
            currentState.current = 'TRACK';
          }
          lastStateChange.current = now;
        }
        break;
      }

      case 'EVADE': {
        if (now > evasionEndTime.current) {
          if (opponentState.hp <= settings.coverHealthThreshold) {
            currentState.current = 'TAKE_COVER';
          } else {
            currentState.current = 'TRACK';
          }
          lastStateChange.current = now;
        }
        break;
      }

      case 'TAKE_COVER': {
        // Seeking obstacle backside
        const hiding = getCoverHidingPosition(
          [dronePos.current.x, dronePos.current.y, dronePos.current.z],
          [playerPos.x, playerPos.y, playerPos.z]
        );
        if (hiding) {
          targetCoverPoint.current = hiding.position;
          const distToHide = dronePos.current.distanceTo(new THREE.Vector3(...hiding.position));
          // If safe behind cover or reached cover position
          if (!hasLineOfSight && distToHide < 20) {
            currentState.current = 'RECOVER';
            lastStateChange.current = now;
          }
        }
        if (timeInState > 6.0) {
          // Fallback if unable to reach cover
          currentState.current = 'REPOSITION';
          lastStateChange.current = now;
        }
        break;
      }

      case 'RECOVER': {
        // Resting behind cover, recharging
        if (hasLineOfSight) {
          // Player managed to flank us!
          currentState.current = 'EVADE';
          evasionEndTime.current = now + 1.0;
          evasionVector.current.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40);
          lastStateChange.current = now;
        } else if (timeInState > 2.5) {
          if (opponentState.hp < 15) {
            currentState.current = 'RETREAT';
          } else {
            currentState.current = 'REPOSITION';
          }
          lastStateChange.current = now;
        }
        break;
      }

      case 'REPOSITION': {
        // Maneuvering around the obstacle rim to flank player
        if (hasLineOfSight && distToPlayer < 100) {
          currentState.current = 'ATTACK';
          lastStateChange.current = now;
        } else if (timeInState > 4.0) {
          currentState.current = 'APPROACH';
          lastStateChange.current = now;
        }
        break;
      }

      case 'RETREAT': {
        // Flees to opposite side of arena
        if (timeInState > 4.5 || distToPlayer > 180) {
          currentState.current = 'TAKE_COVER';
          lastStateChange.current = now;
        }
        break;
      }

      case 'PURSUIT': {
        // Fast chase if player is fleeing
        if (distToPlayer < 70) {
          currentState.current = 'TRACK';
          lastStateChange.current = now;
        }
        break;
      }
    }

    // =========================================================================
    // 2. STEERING & PHYSICS BEHAVIOR FOR CURRENT STATE
    // =========================================================================
    if (currentState.current !== 'DESTROYED') {
      let targetMovePos = playerPos.clone();
      let desiredSpeed = 24;

      switch (currentState.current) {
        case 'IDLE': {
          desiredSpeed = 8;
          targetMovePos.copy(dronePos.current).add(new THREE.Vector3(0, 0, 5));
          break;
        }
        case 'PATROL': {
          desiredSpeed = 22;
          const wp = PATROL_WAYPOINTS[currentWaypointIndex.current];
          targetMovePos.set(wp[0], wp[1], wp[2]);
          break;
        }
        case 'SEARCH': {
          desiredSpeed = 14;
          // Sweep around slowly
          const searchAngle = now * 0.8;
          targetMovePos.set(
            dronePos.current.x + Math.sin(searchAngle) * 30,
            dronePos.current.y + Math.sin(now) * 8,
            dronePos.current.z + Math.cos(searchAngle) * 30
          );
          break;
        }
        case 'APPROACH': {
          desiredSpeed = 36;
          targetMovePos.copy(playerPos);
          break;
        }
        case 'TRACK': {
          desiredSpeed = 26;
          // Orbiting strafe around player at ~55m
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
          // Line up directly for firing run
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
          // Flank sideways
          const rightVector = toPlayer.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
          targetMovePos.copy(dronePos.current).addScaledVector(rightVector, 35);
          break;
        }
        case 'RETREAT': {
          desiredSpeed = 48;
          // Run opposite to player
          targetMovePos.copy(dronePos.current).addScaledVector(toPlayer.clone().normalize(), -80);
          break;
        }
        case 'PURSUIT': {
          desiredSpeed = 46; // Afterburners
          targetMovePos.copy(playerPos);
          break;
        }
      }

      // Arena boundary safety (clamp target inside radius 260)
      if (targetMovePos.length() > COMBAT_CONFIG.ARENA_RADIUS - 40) {
        targetMovePos.clampLength(0, COMBAT_CONFIG.ARENA_RADIUS - 45);
      }

      // Steer velocity towards target
      const steerDir = new THREE.Vector3().subVectors(targetMovePos, dronePos.current).normalize();
      droneVel.current.lerp(steerDir.multiplyScalar(desiredSpeed), dt * 2.5);
      dronePos.current.addScaledVector(droneVel.current, dt);

      // Arena boundary clamp on drone physical position
      if (dronePos.current.length() > COMBAT_CONFIG.ARENA_RADIUS - 10) {
        dronePos.current.clampLength(0, COMBAT_CONFIG.ARENA_RADIUS - 12);
        droneVel.current.multiplyScalar(0.5);
      }

      // Rotate / aim ship
      let aimTarget = playerPos;
      if (currentState.current === 'PATROL' || currentState.current === 'SEARCH') {
        aimTarget = targetMovePos;
      }

      const lookMat = new THREE.Matrix4().lookAt(dronePos.current, aimTarget, new THREE.Vector3(0, 1, 0));
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMat);
      droneQuat.current.slerp(targetQuat, dt * 4.0);
      droneEuler.current.setFromQuaternion(droneQuat.current, 'YXZ');

      // Sync AI transform to store
      updateSoloOpponent(
        [dronePos.current.x, dronePos.current.y, dronePos.current.z],
        [droneEuler.current.x, droneEuler.current.y, droneEuler.current.z],
        [droneVel.current.x, droneVel.current.y, droneVel.current.z],
        opponentState.hp,
        desiredSpeed > 35,
        desiredSpeed / 48
      );
    }

    // =========================================================================
    // 3. WEAPON SYSTEMS (BULLETS + 5.0s LASER BEAM)
    // =========================================================================
    if (currentState.current === 'ATTACK' && hasLineOfSight && distToPlayer < 190) {
      const droneForward = new THREE.Vector3(0, 0, 1).applyQuaternion(droneQuat.current).normalize();

      // --- SECONDARY WEAPON: LASER BEAM (5s Recharge) ---
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
          // Laser beam directly hit player!
          applyDamageToSoloPlayer(COMBAT_CONFIG.LASER_DAMAGE);
          nexusAudio.playWarning();
        }

        setActiveLaserBeam({
          shooterId: 'solo_ai_drone',
          start: [emitterPos.x, emitterPos.y, emitterPos.z],
          end: beamEnd,
          blocked,
          color: opponentState.color || 'red',
          timestamp: Date.now()
        });
      }

      // --- PRIMARY WEAPON: PLASMA BULLET ---
      if (now - lastBulletTime.current > settings.firingInterval) {
        lastBulletTime.current = now;

        const fireDir = new THREE.Vector3().subVectors(playerPos, dronePos.current).normalize();
        // Add aim spread based on difficulty
        fireDir.x += (Math.random() - 0.5) * settings.accuracySpread;
        fireDir.y += (Math.random() - 0.5) * settings.accuracySpread;
        fireDir.z += (Math.random() - 0.5) * settings.accuracySpread;
        fireDir.normalize();

        const bulletVel = fireDir.clone().multiplyScalar(COMBAT_CONFIG.BULLET_SPEED);
        addSoloProjectile({
          id: `ai_bullet_${Math.random()}`,
          ownerId: 'solo_ai_drone',
          position: [dronePos.current.x, dronePos.current.y, dronePos.current.z],
          direction: [bulletVel.x, bulletVel.y, bulletVel.z],
          color: opponentState.color || 'red',
          createdAt: Date.now()
        });
        nexusAudio.playLaser();
      }
    }

    // =========================================================================
    // 4. PROJECTILE COLLISION & OBSTACLE BLOCKING
    // =========================================================================
    const updatedProjectiles: ProjectileState[] = [];
    let stateChanged = false;

    for (const proj of projectiles) {
      const projPos = new THREE.Vector3(...proj.position);
      const projDir = new THREE.Vector3(...proj.direction).normalize();

      // Advance bullet position
      projPos.addScaledVector(projDir, COMBAT_CONFIG.BULLET_SPEED * dt);

      // Expiration (2.4 seconds lifetime)
      if (Date.now() - proj.createdAt > 2400) {
        stateChanged = true;
        continue;
      }

      // Arena boundary collision
      if (projPos.length() > COMBAT_CONFIG.ARENA_RADIUS) {
        stateChanged = true;
        continue;
      }

      let hit = false;

      // 1. Obstacle collision (Bullets blocked by physical cover)
      for (const obs of ARENA_OBSTACLES) {
        const obsPos = new THREE.Vector3(...obs.position);
        if (projPos.distanceTo(obsPos) < obs.radius) {
          hit = true;
          stateChanged = true;
          break; // Bullet absorbed by rock/structure!
        }
      }

      if (hit) continue;

      // 2. Collision against Player
      if (proj.ownerId === 'solo_ai_drone') {
        if (projPos.distanceTo(playerPos) < COMBAT_CONFIG.HITBOX_RADIUS) {
          hit = true;
          stateChanged = true;
          applyDamageToSoloPlayer(COMBAT_CONFIG.BULLET_DAMAGE);
          nexusAudio.playWarning();
        }
      }

      // 3. Collision against AI Drone
      if (proj.ownerId === 'solo_player') {
        totalShotsFired.current++;
        if (projPos.distanceTo(dronePos.current) < COMBAT_CONFIG.HITBOX_RADIUS) {
          hit = true;
          stateChanged = true;
          totalShotsHit.current++;
          applyDamageToSoloOpponent(COMBAT_CONFIG.BULLET_DAMAGE);
          nexusAudio.playHit();

          // Reactive evasive maneuver when struck
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
          position: [projPos.x, projPos.y, projPos.z]
        });
      }
    }

    if (stateChanged) {
      setProjectiles(updatedProjectiles);
    }

    // =========================================================================
    // 5. PLAYER DEFEAT RESOLUTION
    // =========================================================================
    if (selfState.hp <= 0 && !matchEnded.current) {
      matchEnded.current = true;
      const duration = Math.floor((Date.now() - matchStartTime.current) / 1000);
      handleMatchEnd({
        winner: 'solo_ai_drone',
        winnerName: opponentState.name || 'AI Drone',
        loserName: selfState.name || 'Ace Pilot',
        damageDealt: Math.max(0, 100 - opponentState.hp),
        shotsHit: totalShotsHit.current,
        shotsFired: Math.max(1, totalShotsFired.current),
        accuracy: Math.round((totalShotsHit.current / Math.max(1, totalShotsFired.current)) * 100),
        matchDuration: duration
      });
    }
  });

  return null;
};
