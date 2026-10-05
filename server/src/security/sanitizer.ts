import crypto from 'crypto';

/**
 * Sanitizes player display names and callsigns to prevent XSS, HTML injection,
 * and malicious payload execution.
 */
export function sanitizeCallsign(rawName?: unknown): string {
  if (typeof rawName !== 'string') return 'Cadet-01';

  // 1. Strip script and style tags along with their inner contents completely
  let cleaned = rawName.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                       .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Strip all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');

  // 2. Remove control characters, zero-width spaces, and ANSI escape sequences
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');

  // 3. Remove script/event handler indicators
  cleaned = cleaned.replace(/javascript:/gi, '').replace(/data:/gi, '');

  // 4. Collapse multiple spaces into single space and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 5. Enforce length constraints (2 to 15 chars)
  if (cleaned.length < 2) return 'Cadet-01';
  if (cleaned.length > 15) {
    cleaned = cleaned.substring(0, 15).trim();
  }

  return cleaned || 'Cadet-01';
}

/**
 * Validates room code format (4 to 8 alphanumeric characters).
 */
export function isValidRoomCode(code?: unknown): boolean {
  if (typeof code !== 'string') return false;
  return /^[A-Z0-9]{4,8}$/.test(code.trim().toUpperCase());
}

/**
 * Generates an unpredictable, cryptographically random room code using base32 characters.
 */
export function generateSecureRoomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}
