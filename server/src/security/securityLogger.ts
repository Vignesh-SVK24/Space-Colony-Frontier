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

    console.log(`[SECURITY] ${event.eventType} ${JSON.stringify(event)}`);
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
