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

export async function validateKey(key: string): Promise<boolean> {
  try {
    return constantTimeCompare(key, SECRET_KEY);
  } catch (error) {
    console.error('Key validation error:', error);
    return false;
  }
}

export async function createSession(key: string): Promise<AuthResult> {
  try {
    const timestamp = Date.now();
    const duration = parseInt(process.env.SESSION_DURATION || '3600000');
    const sessionData = { keyHash: hashKey(key), timestamp, expiry: timestamp + duration };
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(sessionData), ENCRYPTION_KEY).toString();
    return { success: true, token: encrypted };
  } catch (error) {
    console.error('Session creation error:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

export function decodeSession(token: string): { keyHash: string; timestamp: number; expiry: number } | null {
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
