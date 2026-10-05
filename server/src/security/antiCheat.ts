import { Vector3D, GAME_CONFIG } from '../shared/gameConfig.js';
import { PlayerSchema } from '../schema/BattleState.js';
import { resolveShipMovementCollision } from '../arenaObstacles.js';
import { SecurityLogger } from './securityLogger.js';

export interface MovementRecord {
  lastPosition: Vector3D;
  lastTimestamp: number;
  violationScore: number;
  lastBulletTime: number;
  lastLaserTime: number;
  lastSolarTime: number;
  recentAttackIds: Set<string>;
}

export class AntiCheatSystem {
  // SessionId -> Movement & Combat Record
  private static records = new Map<string, MovementRecord>();

  static registerPlayer(sessionId: string, initialPos: Vector3D) {
    this.records.set(sessionId, {
      lastPosition: { ...initialPos },
      lastTimestamp: Date.now(),
      violationScore: 0,
      lastBulletTime: 0,
      lastLaserTime: 0,
      lastSolarTime: 0,
      recentAttackIds: new Set<string>()
    });
  }

  static unregisterPlayer(sessionId: string) {
    this.records.delete(sessionId);
  }

  static getRecord(sessionId: string): MovementRecord | undefined {
    return this.records.get(sessionId);
  }

  /**
   * Validates player flight movement against speed limits, boundary, and terrain.
   * Returns authoritative coordinates: either the accepted position or a clamped/reverted position.
   */
  static validateMovement(
    sessionId: string,
    player: PlayerSchema,
    desiredPos: [number, number, number],
    desiredRot: [number, number, number],
    desiredVel: [number, number, number]
  ): { valid: boolean; position: Vector3D; shouldDisconnect: boolean } {
    const record = this.records.get(sessionId);
    const now = Date.now();

    if (!record) {
      this.registerPlayer(sessionId, { x: desiredPos[0], y: desiredPos[1], z: desiredPos[2] });
      return {
        valid: true,
        position: { x: desiredPos[0], y: desiredPos[1], z: desiredPos[2] },
        shouldDisconnect: false
      };
    }

    const dt = Math.max(0.001, (now - record.lastTimestamp) / 1000);
    record.lastTimestamp = now;

    const prev = record.lastPosition;
    const target: Vector3D = { x: desiredPos[0], y: desiredPos[1], z: desiredPos[2] };

    // 1. Calculate physical distance moved
    const dx = target.x - prev.x;
    const dy = target.y - prev.y;
    const dz = target.z - prev.z;
    const distMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Max allowed speed: ship boosting max speed (96 m/s) + 25% safety margin
    const maxSpeed = GAME_CONFIG.SHIP_PHYSICS.boostSpeed * 1.25;
    // Allow small burst buffer for network latency packet batching (up to 0.25s)
    const allowedDist = (maxSpeed * dt) + 8.0;

    // 2. Check for impossible speed / teleport hack
    if (distMoved > allowedDist) {
      record.violationScore += 1;
      SecurityLogger.logViolation(sessionId, player.id, 'SPEED_OR_TELEPORT', record.violationScore, {
        distMoved: distMoved.toFixed(2),
        allowedDist: allowedDist.toFixed(2),
        dt: dt.toFixed(3)
      });

      // Reject teleportation: revert to last authoritative position
      return {
        valid: false,
        position: record.lastPosition,
        shouldDisconnect: record.violationScore >= 12
      };
    }

    // 3. Check spherical arena boundary (300m)
    const distFromOrigin = Math.sqrt(target.x * target.x + target.y * target.y + target.z * target.z);
    if (distFromOrigin > GAME_CONFIG.ARENA_RADIUS + 5) {
      record.violationScore += 1;
      SecurityLogger.logViolation(sessionId, player.id, 'BOUNDARY_ESCAPE', record.violationScore, {
        distFromOrigin: distFromOrigin.toFixed(1)
      });

      // Pull back inside boundary
      const factor = (GAME_CONFIG.ARENA_RADIUS - 2) / distFromOrigin;
      const clamped: Vector3D = {
        x: target.x * factor,
        y: target.y * factor,
        z: target.z * factor
      };
      record.lastPosition = clamped;
      return { valid: false, position: clamped, shouldDisconnect: record.violationScore >= 12 };
    }

    // 4. Check terrain and obstacle collision
    const colRes = resolveShipMovementCollision(prev, target, 3.8);
    let resolvedPos = target;
    if (colRes.collided) {
      resolvedPos = { x: colRes.position.x, y: colRes.position.y, z: colRes.position.z };
    }

    // Valid movement step: update authoritative position
    record.lastPosition = resolvedPos;

    // Decay violation score slowly over legitimate play
    if (record.violationScore > 0 && Math.random() < 0.05) {
      record.violationScore = Math.max(0, record.violationScore - 1);
    }

    return {
      valid: true,
      position: resolvedPos,
      shouldDisconnect: false
    };
  }

  /**
   * Validates weapon firing requests against cooldowns, fire rates, origin proximity, and replay.
   */
  static validateWeaponFiring(
    sessionId: string,
    player: PlayerSchema,
    weaponType: 'BULLET' | 'LASER' | 'SOLAR',
    origin: Vector3D,
    direction: Vector3D,
    attackId?: string
  ): { valid: boolean; reason?: string } {
    const record = this.records.get(sessionId);
    if (!record) return { valid: false, reason: 'Unregistered session' };

    const now = Date.now();

    // 1. Packet replay / duplicate attack ID check
    if (attackId) {
      if (record.recentAttackIds.has(attackId)) {
        return { valid: false, reason: 'Duplicate packet replay detected' };
      }
      record.recentAttackIds.add(attackId);
      if (record.recentAttackIds.size > 100) {
        const first = record.recentAttackIds.values().next().value;
        if (first) record.recentAttackIds.delete(first);
      }
    }

    // 2. Weapon origin proximity check (cannot spawn bullets > 6m away from own ship)
    const dx = origin.x - player.position.x;
    const dy = origin.y - player.position.y;
    const dz = origin.z - player.position.z;
    const originDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (originDist > 6.5) {
      record.violationScore += 2;
      SecurityLogger.logViolation(sessionId, player.id, 'REMOTE_WEAPON_ORIGIN', record.violationScore, {
        originDist: originDist.toFixed(2)
      });
      return { valid: false, reason: 'Weapon origin exceeds ship proximity tolerance' };
    }

    // 3. Weapon direction normalization check
    const dirLen = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    if (dirLen < 0.1 || dirLen > 5.0 || !Number.isFinite(dirLen)) {
      return { valid: false, reason: 'Invalid firing direction vector' };
    }

    // 4. Rate of fire check
    if (weaponType === 'BULLET') {
      const minInterval = GAME_CONFIG.BULLET_FIRE_INTERVAL_MS - 20; // 80ms min tolerance
      if (now - record.lastBulletTime < minInterval) {
        record.violationScore += 1;
        SecurityLogger.logViolation(sessionId, player.id, 'RAPID_FIRE_EXPLOIT', record.violationScore, {
          intervalMs: now - record.lastBulletTime
        });
        return { valid: false, reason: 'Bullet fire-rate limit exceeded' };
      }
      record.lastBulletTime = now;
    } else if (weaponType === 'LASER') {
      if (player.laserCooldownRemaining > 0.05) {
        return { valid: false, reason: 'Laser recharge cooldown in progress' };
      }
    } else if (weaponType === 'SOLAR') {
      if (player.solarCooldownRemaining > 0.05) {
        return { valid: false, reason: 'Solar recharge cooldown in progress' };
      }
    }

    return { valid: true };
  }
}
