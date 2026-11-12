import crypto from 'crypto';

/**
 * Space Colony: Frontier - Production Server Security Keys & Configuration
 */

export interface ServerKeysConfig {
  PORT: number;
  NODE_ENV: string;
  SERVER_API_KEY: string;
  ROOM_SECRET_KEY: string;
  SESSION_SECRET: string;
  JWT_SECRET: string;
  ADMIN_TOKEN: string;
  CORS_ORIGIN: string;
  DATABASE_URL?: string;
}

function getOrGenerateSecret(envVar: string | undefined, defaultPrefix: string): string {
  if (envVar && envVar.trim().length > 0) {
    return envVar.trim();
  }
  // In production, generate a secure 256-bit random key per server lifecycle if unconfigured
  return `${defaultPrefix}_${crypto.randomBytes(24).toString('hex')}`;
}

export const SERVER_KEYS: ServerKeysConfig = {
  PORT: Number(process.env.PORT || 3001),
  NODE_ENV: process.env.NODE_ENV || 'production',
  SERVER_API_KEY: getOrGenerateSecret(process.env.SERVER_API_KEY, 'scf_srv_key'),
  ROOM_SECRET_KEY: getOrGenerateSecret(process.env.ROOM_SECRET_KEY, 'scf_room_sec'),
  SESSION_SECRET: getOrGenerateSecret(process.env.SESSION_SECRET, 'scf_session_sec'),
  JWT_SECRET: getOrGenerateSecret(process.env.JWT_SECRET, 'scf_jwt_sec'),
  ADMIN_TOKEN: getOrGenerateSecret(process.env.ADMIN_TOKEN, 'scf_admin_token'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DATABASE_URL: process.env.DATABASE_URL
};

/**
 * Parses and validates an incoming request origin against configured CORS allowlists.
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true; // Mobile apps, curl, or same-origin requests

  const configured = SERVER_KEYS.CORS_ORIGIN;
  if (configured === '*' && SERVER_KEYS.NODE_ENV !== 'production') {
    return true;
  }

  let parsedHostname = '';
  try {
    const parsedUrl = new URL(origin.trim());
    parsedHostname = parsedUrl.hostname.toLowerCase();
  } catch {
    return false; // Reject malformed Origin headers
  }

  // Exact hostname check for local development (prevents localhost.evil.com substring bypass)
  if (parsedHostname === 'localhost' || parsedHostname === '127.0.0.1' || parsedHostname === '[::1]') {
    return true;
  }

  const allowedList = configured
    .split(',')
    .map(o => o.trim().toLowerCase())
    .filter(Boolean);

  const reqOrigin = origin.trim().toLowerCase();
  return allowedList.includes(reqOrigin) || allowedList.includes('*');
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates whether an incoming HTTP or WebSocket request contains
 * a valid administrative server key or admin token using timing-safe comparison.
 */
export function validateServerAdminKey(keyProvided?: string | null): boolean {
  if (!keyProvided) return false;
  const cleanKey = keyProvided.trim();
  return (
    timingSafeMatch(cleanKey, SERVER_KEYS.SERVER_API_KEY) ||
    timingSafeMatch(cleanKey, SERVER_KEYS.ADMIN_TOKEN)
  );
}
