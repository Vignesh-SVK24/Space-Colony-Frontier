/**
 * Space Colony: Frontier - Backend Server Keys & Secrets Configuration
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * All sensitive API keys, room validation secrets, session HMAC tokens,
 * and administration credentials MUST remain strictly on the backend.
 * Under NO circumstances should these keys be bundled into or exported
 * to the frontend client application.
 */

export interface ServerKeysConfig {
  PORT: number;
  NODE_ENV: string;
  SERVER_API_KEY: string;
  ROOM_SECRET_KEY: string;
  SESSION_SECRET: string;
  ADMIN_TOKEN: string;
  CORS_ORIGIN: string;
}

export const SERVER_KEYS: ServerKeysConfig = {
  // Server Port & Environment
  PORT: Number(process.env.PORT || 3001),
  NODE_ENV: process.env.NODE_ENV || 'production',

  // Authoritative Server API Key for inter-service communication
  SERVER_API_KEY: process.env.SERVER_API_KEY || 'scf_srv_live_key_9f82a17b4c6e3d2a',

  // Room HMAC & Integrity Validation Secret
  ROOM_SECRET_KEY: process.env.ROOM_SECRET_KEY || 'scf_room_sec_8410294875b1c93a',

  // Colyseus Session & Authentication Secret
  SESSION_SECRET: process.env.SESSION_SECRET || 'scf_session_sec_5829141029df4821',

  // Admin Master Token for server telemetry & room maintenance
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'scf_admin_master_0491823471ef9982',

  // Allowed CORS Origin for web client
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

/**
 * Validates whether an incoming HTTP or WebSocket request contains
 * a valid administrative server key.
 */
export function validateServerAdminKey(keyProvided?: string | null): boolean {
  if (!keyProvided) return false;
  return keyProvided === SERVER_KEYS.SERVER_API_KEY || keyProvided === SERVER_KEYS.ADMIN_TOKEN;
}
