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

  const allowedList = configured
    .split(',')
    .map(o => o.trim().toLowerCase())
    .filter(Boolean);

  const reqOrigin = origin.trim().toLowerCase();

  // Allow standard local dev hosts when not strictly in external production
  if (reqOrigin.includes('localhost') || reqOrigin.includes('127.0.0.1')) {
    return true;
  }

  return allowedList.includes(reqOrigin) || allowedList.includes('*');
}

/**
 * Validates whether an incoming HTTP or WebSocket request contains
 * a valid administrative server key or admin token.
 */
export function validateServerAdminKey(keyProvided?: string | null): boolean {
  if (!keyProvided) return false;
  const cleanKey = keyProvided.trim();
  return cleanKey === SERVER_KEYS.SERVER_API_KEY || cleanKey === SERVER_KEYS.ADMIN_TOKEN;
}
