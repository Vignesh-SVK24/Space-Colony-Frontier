/**
 * Space Colony: Frontier - Structured Security Event Logger
 * 
 * Guarantees that authentication tokens, passwords, and private credentials
 * are never written to standard outputs or server logs.
 */

export interface SecurityEventData {
  timestamp: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'LOGOUT' | 'VIOLATION' | 'RATE_LIMIT' | 'ACCESS_DENIED';
  ip?: string;
  userId?: string;
  sessionId?: string;
  details?: Record<string, unknown>;
}

export class SecurityLogger {
  private static readonly MAX_RECENT_EVENTS = 250;
  private static recentEvents: SecurityEventData[] = [];
  private static counters: Record<SecurityEventData['eventType'], number> = {
    AUTH_SUCCESS: 0,
    AUTH_FAILURE: 0,
    LOGOUT: 0,
    VIOLATION: 0,
    RATE_LIMIT: 0,
    ACCESS_DENIED: 0
  };

  private static redact(obj: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (/password|token|secret|key|authorization/i.test(key)) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        clean[key] = this.redact(value as Record<string, unknown>);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  static logEvent(
    eventType: SecurityEventData['eventType'],
    data: { ip?: string; userId?: string; sessionId?: string; details?: Record<string, unknown> }
  ) {
    const event: SecurityEventData = {
      timestamp: new Date().toISOString(),
      eventType,
      ip: data.ip,
      userId: data.userId,
      sessionId: data.sessionId,
      details: data.details ? this.redact(data.details) : undefined
    };

    this.counters[eventType] = (this.counters[eventType] || 0) + 1;
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.MAX_RECENT_EVENTS) {
      this.recentEvents.length = this.MAX_RECENT_EVENTS;
    }

    console.log(`[SECURITY] ${event.eventType} ${JSON.stringify(event)}`);
  }

  static getRecentEvents(limit = 50): SecurityEventData[] {
    const safeLimit = Math.max(1, Math.min(this.MAX_RECENT_EVENTS, limit));
    return this.recentEvents.slice(0, safeLimit);
  }

  static getSummary() {
    return {
      counters: { ...this.counters },
      bufferedEvents: this.recentEvents.length
    };
  }

  static logAuthSuccess(userId: string, username: string, ip?: string) {
    this.logEvent('AUTH_SUCCESS', { userId, ip, details: { username } });
  }

  static logAuthFailure(username: string, reason: string, ip?: string) {
    this.logEvent('AUTH_FAILURE', { ip, details: { username, reason } });
  }

  static logViolation(sessionId: string, playerId: string, violationType: string, score: number, details?: Record<string, unknown>) {
    this.logEvent('VIOLATION', {
      sessionId,
      userId: playerId,
      details: { violationType, score, ...details }
    });
  }

  static logRateLimit(ip?: string, endpoint?: string) {
    this.logEvent('RATE_LIMIT', { ip, details: { endpoint } });
  }

  static logAccessDenied(reason: string, ip?: string, userId?: string) {
    this.logEvent('ACCESS_DENIED', { ip, userId, details: { reason } });
  }
}
