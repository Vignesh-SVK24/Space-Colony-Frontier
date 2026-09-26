import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../../multiplayer/useMultiplayerStore';
import { ProjectileState } from '../../../multiplayer/types';
import { nexusAudio } from '../../../utils/nexusAudio';

export const SoloAIBot: React.FC = () => {
  const isSolo = useMultiplayerStore(state => state.isSolo);
  const selfState = useMultiplayerStore(state => state.selfState);
  const opponentState = useMultiplayerStore(state => state.opponentState);
  const projectiles = useMultiplayerStore(state => state.projectiles);
  
  const updateSoloOpponent = useMultiplayerStore(state => state.updateSoloOpponent);
  const addSoloProjectile = useMultiplayerStore(state => state.addSoloProjectile);
  const setProjectiles = useMultiplayerStore(state => state.setProjectiles);
  const applyDamageToSoloPlayer = useMultiplayerStore(state => state.applyDamageToSoloPlayer);
  const applyDamageToSoloOpponent = useMultiplayerStore(state => state.applyDamageToSoloOpponent);
  const handleMatchEnd = useMultiplayerStore(state => state.handleMatchEnd);

  const dronePos = useRef(new THREE.Vector3(0, 10, 80));
  const droneEuler = useRef(new THREE.Euler(0, Math.PI, 0, 'YXZ'));
  const droneQuat = useRef(new THREE.Quaternion().setFromEuler(droneEuler.current));
  const droneVel = useRef(new THREE.Vector3(0, 0, 15));
  
  const lastShootTime = useRef(0);
  const matchStartTime = useRef(Date.now());
  const matchEnded = useRef(false);

  useFrame((state, delta) => {
    if (!isSolo || !selfState || !opponentState || matchEnded.current) return;

    const dt = Math.min(delta, 0.1);
    const playerPos = new THREE.Vector3().fromArray(selfState.position);

    // ==========================================
    // 1. AI Flight Dynamics (Circling & Pursuit)
    // ==========================================
    const toPlayer = new THREE.Vector3().subVectors(playerPos, dronePos.current);
    const distToPlayer = toPlayer.length();

    // Target position: maintain ~50-80m distance while orbiting
    const orbitAngle = state.clock.elapsedTime * 0.4;
    const targetOrbitPos = new THREE.Vector3(
      playerPos.x + Math.sin(orbitAngle) * 60,
      playerPos.y + Math.sin(state.clock.elapsedTime * 0.8) * 12 + 6,
      playerPos.z + Math.cos(orbitAngle) * 60
    );

    // Arena boundary pushback (keep inside radius 240)
    if (targetOrbitPos.length() > 240) {
      targetOrbitPos.clampLength(0, 230);
    }

    // Steer towards orbit point
    const steerDir = new THREE.Vector3().subVectors(targetOrbitPos, dronePos.current).normalize();
    const speed = distToPlayer > 120 ? 32 : 18;
    
    droneVel.current.lerp(steerDir.multiplyScalar(speed), dt * 2.0);
    dronePos.current.addScaledVector(droneVel.current, dt);

    // Face towards player
    const lookMatrix = new THREE.Matrix4().lookAt(dronePos.current, playerPos, new THREE.Vector3(0, 1, 0));
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
    droneQuat.current.slerp(targetQuat, dt * 3.5);
    droneEuler.current.setFromQuaternion(droneQuat.current, 'YXZ');

    // Update store with drone state
    updateSoloOpponent(
      [dronePos.current.x, dronePos.current.y, dronePos.current.z],
      [droneEuler.current.x, droneEuler.current.y, droneEuler.current.z],
      [droneVel.current.x, droneVel.current.y, droneVel.current.z],
      opponentState.hp,
      false,
      speed / 35
    );

    // ==========================================
    // 2. AI Weapon Firing
    // ==========================================
    const now = state.clock.elapsedTime;
    if (distToPlayer < 180 && now - lastShootTime.current > 2.2) {
      lastShootTime.current = now;
      
      const fireDir = new THREE.Vector3().subVectors(playerPos, dronePos.current).normalize();
      // Add small aim inaccuracy
      fireDir.x += (Math.random() - 0.5) * 0.08;
      fireDir.y += (Math.random() - 0.5) * 0.08;
      fireDir.normalize();

      const aiLaser: ProjectileState = {
        id: `ai_laser_${Math.random()}`,
        ownerId: 'solo_ai_drone',
        position: [dronePos.current.x, dronePos.current.y, dronePos.current.z],
        direction: [fireDir.x * 120, fireDir.y * 120, fireDir.z * 120],
        color: opponentState.color || 'red',
        createdAt: Date.now()
      };

      addSoloProjectile(aiLaser);
      nexusAudio.playLaser();
    }

    // ==========================================
    // 3. Projectile Collision & Damage Detection
    // ==========================================
    const updatedProjectiles: ProjectileState[] = [];
    let playerTookDamage = false;
    let droneTookDamage = false;

    for (const proj of projectiles) {
      const projPos = new THREE.Vector3().fromArray(proj.position);
      const projVel = new THREE.Vector3().fromArray(proj.direction);
      
      // Advance projectile position
      projPos.addScaledVector(projVel.clone().normalize(), 140 * dt);

      // Lifetime check (2.5s)
      if (Date.now() - proj.createdAt > 2500) continue;

      let hit = false;

      // Check collision against Player
      if (proj.ownerId === 'solo_ai_drone') {
        if (projPos.distanceTo(playerPos) < 3.2) {
          hit = true;
          playerTookDamage = true;
          applyDamageToSoloPlayer(10);
          nexusAudio.playWarning();
        }
      }

      // Check collision against AI Drone
      if (proj.ownerId === 'solo_player') {
        if (projPos.distanceTo(dronePos.current) < 3.5) {
          hit = true;
          droneTookDamage = true;
          applyDamageToSoloOpponent(10);
          nexusAudio.playHit();
        }
      }

      if (!hit) {
        updatedProjectiles.push({
          ...proj,
          position: [projPos.x, projPos.y, projPos.z]
        });
      }
    }

    if (playerTookDamage || droneTookDamage || updatedProjectiles.length !== projectiles.length) {
      setProjectiles(updatedProjectiles);
    }

    // ==========================================
    // 4. Win / Loss Resolution
    // ==========================================
    const duration = Math.floor((Date.now() - matchStartTime.current) / 1000);

    if (opponentState.hp <= 0 && !matchEnded.current) {
      matchEnded.current = true;
      handleMatchEnd({
        winner: 'solo_player',
        winnerName: selfState.name || 'Ace Pilot',
        loserName: 'TARGET DRONE (AI)',
        damageDealt: 100,
        shotsHit: 10,
        shotsFired: 14,
        accuracy: 71,
        matchDuration: duration
      });
      nexusAudio.playVictory();
    } else if (selfState.hp <= 0 && !matchEnded.current) {
      matchEnded.current = true;
      handleMatchEnd({
        winner: 'solo_ai_drone',
        winnerName: 'TARGET DRONE (AI)',
        loserName: selfState.name || 'Ace Pilot',
        damageDealt: Math.max(0, 100 - opponentState.hp),
        shotsHit: Math.floor((100 - opponentState.hp) / 10),
        shotsFired: 15,
        accuracy: 45,
        matchDuration: duration
      });
    }
  });

  return null;
};
