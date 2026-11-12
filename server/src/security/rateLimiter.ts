import { rateLimit } from 'express-rate-limit';
import { SecurityLogger } from './securityLogger.js';

/**
 * Express rate limiter for authentication endpoints (Registration & Login).
 * Prevents brute-force credential stuffing and password guessing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 requests per IP per window
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this sector. Access temporarily delayed.'
  },
  handler: (req, res, next, options) => {
    const ip = req.ip || req.socket.remoteAddress;
    SecurityLogger.logRateLimit(ip, req.originalUrl);
    res.status(429).json(options.message);
  }
});

/**
 * In-memory room-code brute-force protection.
 * Protects against automated sequential room-code enumeration.
 */
export class RoomBruteForceProtection {
  private static failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

  static isLocked(ip?: string): boolean {
    if (!ip) return false;
    const record = this.failedAttempts.get(ip);
    if (!record || record.lockedUntil === 0) return false;
    if (Date.now() < record.lockedUntil) {
      return true;
    }
    // Expired lockout
    this.failedAttempts.delete(ip);
    return false;
  }

  static recordFailure(ip?: string) {
    if (!ip) return;
    const now = Date.now();
    const existing = this.failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
    existing.count += 1;

    // After 6 invalid room-code probes, lock out room joins for 3 minutes
    if (existing.count >= 6) {
      existing.lockedUntil = now + (3 * 60 * 1000);
      SecurityLogger.logRateLimit(ip, 'ROOM_CODE_BRUTE_FORCE');
    }

    this.failedAttempts.set(ip, existing);
  }

  static recordSuccess(ip?: string) {
    if (!ip) return;
    this.failedAttempts.delete(ip);
  }
}

/**
 * WebSocket per-client message frequency limiter.
 * Caps client message rate at 60Hz with burst tolerance of 25 messages.
 */
export class WebSocketRateLimiter {
  private static clientBuckets = new Map<string, { tokens: number; lastRefill: number; violations: number }>();

  static canProcessMessage(clientId: string): boolean {
    const now = Date.now();
    let bucket = this.clientBuckets.get(clientId);

    if (!bucket) {
      bucket = { tokens: 25, lastRefill: now, violations: 0 };
      this.clientBuckets.set(clientId, bucket);
    }

    // Refill tokens: 60 tokens per second (1 token every 16.6ms)
    const elapsedMs = now - bucket.lastRefill;
    const refillTokens = (elapsedMs / 1000) * 60;
    bucket.tokens = Math.min(25, bucket.tokens + refillTokens);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    // Rate limit exceeded
    bucket.violations += 1;
    if (bucket.violations === 1 || bucket.violations % 25 === 0) {
      SecurityLogger.logRateLimit(clientId, 'WS_MESSAGE_FLOOD');
    }
    return false;
  }

  static isAbusive(clientId: string): boolean {
    const bucket = this.clientBuckets.get(clientId);
    return Boolean(bucket && bucket.violations >= 100);
  }

  static unregisterClient(clientId: string) {
    this.clientBuckets.delete(clientId);
  }
}

/**
 * Per-IP WebSocket connection flooding & resource-exhaustion guard.
 */
export class ConnectionFloodGuard {
  private static readonly MAX_ACTIVE_PER_IP = 8;
  private static readonly MAX_CONNECTS_PER_WINDOW = 30;
  private static readonly WINDOW_MS = 60 * 1000;

  private static activeByIp = new Map<string, number>();
  private static recentConnects = new Map<string, { count: number; windowStart: number }>();

  static canAcceptConnection(ip?: string): boolean {
    if (!ip || ip === 'unknown') return true;
    const now = Date.now();

    const active = this.activeByIp.get(ip) || 0;
    if (active >= this.MAX_ACTIVE_PER_IP) {
      SecurityLogger.logRateLimit(ip, 'WS_MAX_ACTIVE_CONNECTIONS');
      return false;
    }

    const recent = this.recentConnects.get(ip);
    if (!recent || now - recent.windowStart > this.WINDOW_MS) {
      this.recentConnects.set(ip, { count: 1, windowStart: now });
      return true;
    }

    recent.count += 1;
    if (recent.count > this.MAX_CONNECTS_PER_WINDOW) {
      SecurityLogger.logRateLimit(ip, 'WS_CONNECTION_FLOOD');
      return false;
    }
    return true;
  }

  static trackOpen(ip?: string) {
    if (!ip || ip === 'unknown') return;
    this.activeByIp.set(ip, (this.activeByIp.get(ip) || 0) + 1);
  }

  static trackClose(ip?: string) {
    if (!ip || ip === 'unknown') return;
    const cur = this.activeByIp.get(ip) || 0;
    if (cur <= 1) {
      this.activeByIp.delete(ip);
    } else {
      this.activeByIp.set(ip, cur - 1);
    }
  }
}
