import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeCallsign, generateSecureRoomCode } from '../server/src/security/sanitizer';
import { 
  InputMessageSchema, 
  FireWeaponSchema, 
  JoinRoomOptionsSchema,
  AuthRegisterSchema,
  AuthLoginSchema
} from '../server/src/security/schemas';
import { AntiCheatSystem } from '../server/src/security/antiCheat';
import { AuthService } from '../server/src/security/authService';
import { RoomBruteForceProtection } from '../server/src/security/rateLimiter';
import { useMultiplayerStore } from '../src/multiplayer/useMultiplayerStore';
import { PlayerSchema } from '../server/src/schema/BattleState';

describe('Security & Anti-Cheat Comprehensive Test Suite', () => {
  beforeEach(() => {
    useMultiplayerStore.getState().reset();
  });

  describe('1. Input Sanitization & XSS Prevention', () => {
    it('should strip dangerous HTML and script tags from callsigns', () => {
      const malicious = '<script>alert("hacked")</script>Viper';
      const sanitized = sanitizeCallsign(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Viper');
    });

    it('should strip HTML event handlers and javascript: URIs', () => {
      const payload = '<img src=x onerror=alert(1)>Ghost';
      const sanitized = sanitizeCallsign(payload);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toBe('Ghost');
    });

    it('should enforce length bounds and strip control characters', () => {
      const veryLong = 'SuperLongCallsignThatExceedsTheMaximumAllowedCharactersInTheGame';
      const sanitized = sanitizeCallsign(veryLong);
      expect(sanitized.length).toBeLessThanOrEqual(15);

      const withControlChars = 'Pilot\u0000\u001F\u0007Ace';
      const cleaned = sanitizeCallsign(withControlChars);
      expect(cleaned).toBe('PilotAce');
    });

    it('should fallback to Cadet-01 if entire callsign is invalid or whitespace', () => {
      const empty = '   ';
      const fallback = sanitizeCallsign(empty);
      expect(fallback).toBe('Cadet-01');
    });
  });

  describe('2. Cryptographic Room Code Generation & Uniqueness', () => {
    it('should generate 6-character uppercase codes using secure CSPRNG', () => {
      const code = generateSecureRoomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it('should never contain ambiguous characters (0, 1, I, O)', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateSecureRoomCode();
        expect(code).not.toContain('0');
        expect(code).not.toContain('1');
        expect(code).not.toContain('I');
        expect(code).not.toContain('O');
      }
    });

    it('should generate distinct codes with high entropy', () => {
      const codeSet = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codeSet.add(generateSecureRoomCode());
      }
      expect(codeSet.size).toBe(100);
    });
  });

  describe('3. Zod Runtime Schema Validation on Ingress Messages', () => {
    it('should validate legal flight input packets', () => {
      const legalInput = {
        throttle: 0.8,
        pitch: -0.2,
        yaw: 0.5,
        roll: 0.0,
        boost: true,
        drift: false
      };
      const result = InputMessageSchema.safeParse(legalInput);
      expect(result.success).toBe(true);
    });

    it('should reject malformed or out-of-bounds flight inputs', () => {
      const speedHackedInput = {
        throttle: 9999, // Exceeds clamp range [0, 1]
        pitch: 0,
        yaw: 0,
        roll: 0,
        boost: false
      };
      const result = InputMessageSchema.safeParse(speedHackedInput);
      expect(result.success).toBe(false);

      const nanInput = {
        throttle: NaN,
        pitch: 0,
        yaw: 0,
        roll: 0,
        boost: false
      };
      expect(InputMessageSchema.safeParse(nanInput).success).toBe(false);
    });

    it('should validate structured weapon firing requests', () => {
      const fireMessage = {
        weaponType: 'bullet',
        origin: [0, 10, 0] as [number, number, number],
        direction: [0, 0, 1] as [number, number, number],
        attackId: 'atk_test_123',
        timestamp: Date.now()
      };
      const result = FireWeaponSchema.safeParse(fireMessage);
      expect(result.success).toBe(true);
    });

    it('should reject weapon messages with invalid types or non-finite origins', () => {
      const invalidWeapon = {
        weaponType: 'nuke_instant_win',
        origin: [0, 10, 0],
        direction: [0, 0, 1]
      };
      expect(FireWeaponSchema.safeParse(invalidWeapon).success).toBe(false);

      const nanOrigin = {
        weaponType: 'bullet',
        origin: [NaN, 0, 0],
        direction: [0, 0, 1]
      };
      expect(FireWeaponSchema.safeParse(nanOrigin).success).toBe(false);
    });

    it('should validate room join options', () => {
      const validOptions = {
        roomCode: 'K9X2B7',
        playerName: 'Maverick',
        playerColor: 'yellow',
        mode: '1v1'
      };
      expect(JoinRoomOptionsSchema.safeParse(validOptions).success).toBe(true);

      const invalidColor = {
        roomCode: 'K9X2B7',
        playerName: 'Maverick',
        playerColor: 'invisible_cheat'
      };
      expect(JoinRoomOptionsSchema.safeParse(invalidColor).success).toBe(false);
    });

    it('should validate auth registration & login schemas', () => {
      expect(AuthRegisterSchema.safeParse({
        username: 'AcePilot',
        password: 'securePassword123',
        preferredColor: 'blue'
      }).success).toBe(true);

      expect(AuthRegisterSchema.safeParse({
        username: 'A', // too short (< 3)
        password: '123' // too short (< 6)
      }).success).toBe(false);

      expect(AuthLoginSchema.safeParse({
        username: 'AcePilot',
        password: 'securePassword123'
      }).success).toBe(true);
    });
  });

  describe('4. Authoritative Movement Anti-Cheat & Teleport Clamping', () => {
    const makeMockPlayer = (id: string, x = 0, y = 10, z = 0): PlayerSchema => {
      const p = new PlayerSchema();
      p.id = id;
      p.position.x = x;
      p.position.y = y;
      p.position.z = z;
      return p;
    };

    it('should accept valid continuous flight movement without violations', () => {
      const sessionId = 'test_sess_01';
      const player = makeMockPlayer('p1', 0, 10, 0);
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });

      // Move 5m
      const result = AntiCheatSystem.validateMovement(
        sessionId,
        player,
        [0, 10, 5],
        [0, 0, 0],
        [0, 0, 10]
      );
      expect(result.valid).toBe(true);
      expect(result.position.z).toBeCloseTo(5, 1);
      const record = AntiCheatSystem.getRecord(sessionId);
      expect(record?.violationScore).toBe(0);
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should detect superluminal speed hacking and revert to authoritative position', () => {
      const sessionId = 'test_sess_02';
      const player = makeMockPlayer('p2', 0, 10, 0);
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });

      // Hacker attempts to move 400m instantly in a single tick
      const result = AntiCheatSystem.validateMovement(
        sessionId,
        player,
        [0, 10, 400],
        [0, 0, 0],
        [0, 0, 10]
      );
      expect(result.valid).toBe(false);
      // Reverted to previous authoritative coordinate
      expect(result.position.z).toBe(0);
      const record = AntiCheatSystem.getRecord(sessionId);
      expect(record?.violationScore).toBeGreaterThan(0);
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should clamp positions that attempt to escape outside the arena radius', () => {
      const sessionId = 'test_sess_03';
      const player = makeMockPlayer('p3', 0, 10, 0);
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });

      // Hacker attempts to go to 500m (arena boundary is 300m)
      // First update timestamp to simulate enough time
      const record = AntiCheatSystem.getRecord(sessionId);
      if (record) record.lastTimestamp = Date.now() - 5000;

      const result = AntiCheatSystem.validateMovement(
        sessionId,
        player,
        [500, 10, 0],
        [0, 0, 0],
        [10, 0, 0]
      );
      expect(result.valid).toBe(false);
      const distFromCenter = Math.sqrt(result.position.x ** 2 + result.position.y ** 2 + result.position.z ** 2);
      expect(distFromCenter).toBeLessThanOrEqual(302);
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should accumulate violation score and flag disconnection when score threshold reached', () => {
      const sessionId = 'test_sess_04';
      const player = makeMockPlayer('p4', 0, 0, 0);
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 0, z: 0 });

      let shouldDisconnect = false;
      for (let i = 0; i < 15; i++) {
        const res = AntiCheatSystem.validateMovement(
          sessionId,
          player,
          [900 + i * 50, 0, 0],
          [0, 0, 0],
          [0, 0, 0]
        );
        if (res.shouldDisconnect) shouldDisconnect = true;
      }
      expect(shouldDisconnect).toBe(true);
      AntiCheatSystem.unregisterPlayer(sessionId);
    });
  });

  describe('5. Authoritative Combat Anti-Cheat & Rapid-Fire Prevention', () => {
    const makePlayerWithCooldowns = (laserCd = 0, solarCd = 0): PlayerSchema => {
      const p = new PlayerSchema();
      p.id = 'combat_tester';
      p.position.x = 0;
      p.position.y = 10;
      p.position.z = 0;
      p.laserCooldownRemaining = laserCd;
      p.solarCooldownRemaining = solarCd;
      return p;
    };

    it('should permit bullet firing at legal intervals (>= 100ms)', () => {
      const sessionId = 'combat_sess_01';
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });
      const player = makePlayerWithCooldowns();

      const origin = { x: 0, y: 10, z: 1 };
      const dir = { x: 0, y: 0, z: 1 };

      const first = AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', origin, dir, 'atk_01');
      expect(first.valid).toBe(true);

      // Artificially advance record's last bullet time
      const record = AntiCheatSystem.getRecord(sessionId);
      if (record) record.lastBulletTime -= 120;

      const second = AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', origin, dir, 'atk_02');
      expect(second.valid).toBe(true);
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should reject rapid-fire exploit (< 100ms interval for bullets)', () => {
      const sessionId = 'combat_sess_02';
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });
      const player = makePlayerWithCooldowns();

      const origin = { x: 0, y: 10, z: 1 };
      const dir = { x: 0, y: 0, z: 1 };

      const first = AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', origin, dir, 'atk_f1');
      expect(first.valid).toBe(true);

      // Immediate second shot without advancing time
      const second = AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', origin, dir, 'atk_f2');
      expect(second.valid).toBe(false);
      expect(second.reason).toContain('fire-rate limit');
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should enforce weapon cooldowns for Laser (3s) and Solar Beam (10s)', () => {
      const sessionId = 'combat_sess_03';
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });

      // Player with active cooldowns
      const onCooldownPlayer = makePlayerWithCooldowns(2.5, 8.0);
      const origin = { x: 0, y: 10, z: 1 };
      const dir = { x: 0, y: 0, z: 1 };

      expect(AntiCheatSystem.validateWeaponFiring(sessionId, onCooldownPlayer, 'LASER', origin, dir, 'atk_l1').valid).toBe(false);
      expect(AntiCheatSystem.validateWeaponFiring(sessionId, onCooldownPlayer, 'SOLAR', origin, dir, 'atk_s1').valid).toBe(false);

      // Player with ready cooldowns
      const readyPlayer = makePlayerWithCooldowns(0, 0);
      expect(AntiCheatSystem.validateWeaponFiring(sessionId, readyPlayer, 'LASER', origin, dir, 'atk_l2').valid).toBe(true);
      expect(AntiCheatSystem.validateWeaponFiring(sessionId, readyPlayer, 'SOLAR', origin, dir, 'atk_s2').valid).toBe(true);
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should reject shots fired with origin far from verified player position', () => {
      const sessionId = 'combat_sess_04';
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });
      const player = makePlayerWithCooldowns();

      // Projectile origin claims to be 50m away from the ship
      const spoofedOrigin = { x: 50, y: 10, z: 0 };
      const dir = { x: 0, y: 0, z: 1 };

      const res = AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', spoofedOrigin, dir, 'atk_spoof');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('proximity');
      AntiCheatSystem.unregisterPlayer(sessionId);
    });

    it('should prevent replay attacks using deduplicated attackId tracking', () => {
      const sessionId = 'combat_sess_05';
      AntiCheatSystem.registerPlayer(sessionId, { x: 0, y: 10, z: 0 });
      const player = makePlayerWithCooldowns();
      const origin = { x: 0, y: 10, z: 1 };
      const dir = { x: 0, y: 0, z: 1 };

      expect(AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', origin, dir, 'atk_unique_1').valid).toBe(true);

      const record = AntiCheatSystem.getRecord(sessionId);
      if (record) record.lastBulletTime -= 200;

      // Re-sending same attackId must be rejected
      const replay = AntiCheatSystem.validateWeaponFiring(sessionId, player, 'BULLET', origin, dir, 'atk_unique_1');
      expect(replay.valid).toBe(false);
      expect(replay.reason).toContain('replay');
      AntiCheatSystem.unregisterPlayer(sessionId);
    });
  });

  describe('6. Player Authentication & JWT Session Security', () => {
    it('should register a pilot, hash password with bcrypt, and issue signed JWT', async () => {
      const reg = await AuthService.register('CommanderTest', 'PilotPassword999', 'blue');
      expect(reg.user.username).toBe('CommanderTest');
      expect(reg.user.preferredColor).toBe('blue');
      expect(reg.token).toBeDefined();

      // Verify the token
      const verified = AuthService.verifyToken(reg.token);
      expect(verified).not.toBeNull();
      expect(verified?.username).toBe('CommanderTest');
      expect(verified?.isGuest).toBe(false);
    });

    it('should authenticate registered pilot with correct password and reject wrong password', async () => {
      await AuthService.register('PilotGhost', 'SecretPass77', 'red');

      // Correct password
      const loginSuccess = await AuthService.login('PilotGhost', 'SecretPass77');
      expect(loginSuccess.token).toBeDefined();

      // Wrong password
      await expect(AuthService.login('PilotGhost', 'WrongPass')).rejects.toThrow();
    });

    it('should reject registration with duplicate callsigns', async () => {
      await AuthService.register('UniquePilot', 'SecretPass1', 'yellow');
      await expect(AuthService.register('UniquePilot', 'SecretPass2', 'blue')).rejects.toThrow(/already registered/);
    });

    it('should generate guest session token for unauthenticated players', () => {
      const guest = AuthService.generateGuestSession('Recruit-9');
      expect(guest.token).toBeDefined();
      expect(guest.username).toContain('Recruit-9');

      const verified = AuthService.verifyToken(guest.token);
      expect(verified?.isGuest).toBe(true);
    });

    it('should support token revocation on logout', () => {
      const session = AuthService.generateGuestSession('Cadet-Revoke');
      expect(AuthService.verifyToken(session.token)).not.toBeNull();

      AuthService.revokeToken(session.token);
      // Revoked token must no longer verify
      expect(AuthService.verifyToken(session.token)).toBeNull();
    });
  });

  describe('7. Room Brute-Force & Enumeration Protection', () => {
    it('should track failed attempts and lock out offending IP after threshold', () => {
      const testIp = '198.51.100.42';

      expect(RoomBruteForceProtection.isLocked(testIp)).toBe(false);

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        RoomBruteForceProtection.recordFailure(testIp);
      }
      expect(RoomBruteForceProtection.isLocked(testIp)).toBe(false);

      // 6th failed attempt triggers lockout
      RoomBruteForceProtection.recordFailure(testIp);
      expect(RoomBruteForceProtection.isLocked(testIp)).toBe(true);
    });

    it('should reset failed attempts upon successful authentication/join', () => {
      const testIp = '198.51.100.43';
      RoomBruteForceProtection.recordFailure(testIp);
      RoomBruteForceProtection.recordFailure(testIp);

      RoomBruteForceProtection.recordSuccess(testIp);
      expect(RoomBruteForceProtection.isLocked(testIp)).toBe(false);
    });
  });

  describe('8. Frontend Store Security State & Auth Actions', () => {
    it('should initialize with no authentication and modal closed', () => {
      const store = useMultiplayerStore.getState();
      expect(store.authModalOpen).toBe(false);
      expect(store.authUser).toBeNull();
    });

    it('should allow toggling the pilot auth modal', () => {
      useMultiplayerStore.getState().setAuthModalOpen(true);
      expect(useMultiplayerStore.getState().authModalOpen).toBe(true);

      useMultiplayerStore.getState().setAuthModalOpen(false);
      expect(useMultiplayerStore.getState().authModalOpen).toBe(false);
    });
  });
});
