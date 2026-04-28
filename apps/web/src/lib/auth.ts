import CryptoJS from 'crypto-js';
import type { AuthResult } from './types';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-encryption-key-';
const SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key-change-in-production';

export function hashKey(key: string): string {
  return CryptoJS.SHA256(key + SECRET_KEY).toString();
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a time-limited access code for a specific user.
 * The code is self-validating (no database required).
 */
export function generateUserCode(userId: string, expiresInHours: number = 24): string {
  const expiry = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
  const payload = `${userId.toLowerCase().trim()}:${expiry}`;
  const signature = CryptoJS.HmacSHA256(payload, SECRET_KEY).toString(CryptoJS.enc.Hex).slice(0, 10);
  const code = btoa(payload + ':' + signature)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return code;
}

/**
 * Validate a user-generated time-limited code.
 */
export function validateUserCode(code: string): { valid: boolean; userId?: string; error?: string } {
  try {
    // Restore base64 padding
    let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) base64 += '=';

    const decoded = atob(base64);
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return { valid: false, error: 'Invalid code format' };

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const [userId, expiryStr] = payload.split(':');
    const expiry = parseInt(expiryStr, 10);

    if (!userId || isNaN(expiry)) {
      return { valid: false, error: 'Invalid code format' };
    }

    // Check expiry
    if (Math.floor(Date.now() / 1000) > expiry) {
      return { valid: false, error: 'Code expired' };
    }

    // Verify signature
    const expectedSig = CryptoJS.HmacSHA256(payload, SECRET_KEY).toString(CryptoJS.enc.Hex).slice(0, 10);
    if (!constantTimeCompare(signature, expectedSig)) {
      return { valid: false, error: 'Invalid code' };
    }

    return { valid: true, userId };
  } catch {
    return { valid: false, error: 'Invalid code' };
  }
}

export async function validateKey(key: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    // First check if it's the master key
    if (constantTimeCompare(key, SECRET_KEY)) {
      return { valid: true, userId: 'admin' };
    }

    // Then check if it's a time-limited user code
    const userResult = validateUserCode(key);
    if (userResult.valid) {
      return userResult;
    }

    return { valid: false, error: userResult.error || 'Invalid key' };
  } catch (error) {
    console.error('Key validation error:', error);
    return { valid: false, error: 'Validation error' };
  }
}

export async function createSession(key: string, userId?: string): Promise<AuthResult> {
  try {
    const timestamp = Date.now();
    const duration = parseInt(process.env.SESSION_DURATION || '3600000');
    const sessionData = {
      keyHash: hashKey(key),
      userId: userId || 'unknown',
      timestamp,
      expiry: timestamp + duration
    };
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(sessionData), ENCRYPTION_KEY).toString();
    return { success: true, token: encrypted };
  } catch (error) {
    console.error('Session creation error:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

export function decodeSession(token: string): { keyHash: string; userId: string; timestamp: number; expiry: number } | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(token, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export function isSessionValid(token: string): boolean {
  const session = decodeSession(token);
  if (!session) return false;
  return Date.now() < session.expiry;
}
