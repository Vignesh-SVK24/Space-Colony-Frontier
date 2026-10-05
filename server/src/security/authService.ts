import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { SERVER_KEYS } from '../config/serverKeys.js';
import { SecurityLogger } from './securityLogger.js';
import { sanitizeCallsign } from './sanitizer.js';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: 'pilot' | 'admin';
  preferredColor: string;
  createdAt: Date;
  stats: {
    wins: number;
    losses: number;
    kills: number;
    shotsFired: number;
    shotsHit: number;
    damageDealt: number;
  };
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: 'pilot' | 'admin' | 'guest';
  isGuest: boolean;
  jti: string;
}

export class AuthService {
  // In-memory persistent account registry (used when database is offline or standalone)
  private static users = new Map<string, UserAccount>(); // username.toLowerCase() -> UserAccount
  private static usersById = new Map<string, UserAccount>(); // id -> UserAccount
  private static revokedTokens = new Set<string>(); // jti

  /**
   * Registers a new pilot account with bcrypt-hashed password (cost factor 12).
   */
  static async register(
    rawUsername: string,
    rawPassword: string,
    preferredColor: string = 'yellow'
  ): Promise<{ user: Omit<UserAccount, 'passwordHash'>; token: string }> {
    const username = sanitizeCallsign(rawUsername);
    const key = username.toLowerCase();

    if (this.users.has(key)) {
      throw new Error('Callsign is already registered by another pilot');
    }

    if (rawPassword.length < 6) {
      throw new Error('Security clearance password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const user: UserAccount = {
      id: uuidv4(),
      username,
      passwordHash,
      role: 'pilot',
      preferredColor,
      createdAt: new Date(),
      stats: {
        wins: 0,
        losses: 0,
        kills: 0,
        shotsFired: 0,
        shotsHit: 0,
        damageDealt: 0
      }
    };

    this.users.set(key, user);
    this.usersById.set(user.id, user);

    SecurityLogger.logAuthSuccess(user.id, user.username);
    const token = this.generateToken(user.id, user.username, user.role, false);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  /**
   * Authenticates a pilot with username and password.
   */
  static async login(
    rawUsername: string,
    rawPassword: string
  ): Promise<{ user: Omit<UserAccount, 'passwordHash'>; token: string }> {
    const key = rawUsername.trim().toLowerCase();
    const user = this.users.get(key);

    if (!user) {
      SecurityLogger.logAuthFailure(rawUsername, 'User not found');
      throw new Error('Invalid callsign or security password');
    }

    const passwordValid = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!passwordValid) {
      SecurityLogger.logAuthFailure(rawUsername, 'Invalid password');
      throw new Error('Invalid callsign or security password');
    }

    SecurityLogger.logAuthSuccess(user.id, user.username);
    const token = this.generateToken(user.id, user.username, user.role, false);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  /**
   * Generates a signed guest session token for immediate play without formal registration.
   */
  static generateGuestSession(rawCallsign?: string): { userId: string; username: string; token: string } {
    const username = sanitizeCallsign(rawCallsign);
    const userId = `guest_${uuidv4().substring(0, 8)}`;
    const token = this.generateToken(userId, username, 'guest', true);
    return { userId, username, token };
  }

  /**
   * Generates a signed JWT access token.
   */
  private static generateToken(
    userId: string,
    username: string,
    role: 'pilot' | 'admin' | 'guest',
    isGuest: boolean
  ): string {
    const jti = uuidv4();
    const payload: AuthTokenPayload = {
      userId,
      username,
      role,
      isGuest,
      jti
    };

    return jwt.sign(payload, SERVER_KEYS.JWT_SECRET, {
      expiresIn: isGuest ? '6h' : '24h'
    });
  }

  /**
   * Verifies and decodes an incoming JWT token.
   */
  static verifyToken(token?: string | null): AuthTokenPayload | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) return null;

    try {
      const decoded = jwt.verify(cleanToken, SERVER_KEYS.JWT_SECRET) as AuthTokenPayload;
      if (this.revokedTokens.has(decoded.jti)) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Revokes a session token immediately on logout.
   */
  static revokeToken(token?: string | null) {
    if (!token) return;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    try {
      const decoded = jwt.decode(cleanToken) as AuthTokenPayload;
      if (decoded && decoded.jti) {
        this.revokedTokens.add(decoded.jti);
      }
    } catch {}
  }

  /**
   * Retrieves safe profile and stats for a given user ID.
   */
  static getUserProfile(userId: string): Omit<UserAccount, 'passwordHash'> | null {
    const user = this.usersById.get(userId);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Records match outcome statistics authoritatively.
   */
  static recordMatchStats(
    userId: string,
    isWinner: boolean,
    damage: number,
    shotsFired: number,
    shotsHit: number
  ) {
    const user = this.usersById.get(userId);
    if (!user) return;

    if (isWinner) {
      user.stats.wins += 1;
    } else {
      user.stats.losses += 1;
    }
    user.stats.damageDealt += Math.max(0, damage);
    user.stats.shotsFired += Math.max(0, shotsFired);
    user.stats.shotsHit += Math.max(0, shotsHit);
  }
}
