import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const COOKIE_NAME = 'revenuesid';

// For tests
export function _setEnv(access: string, session: string) {
  process.env.REVENUE_ACCESS_SECRET = access;
  process.env.REVENUE_SESSION_SECRET = session;
}

export function verifyPassword(password: string): boolean {
  const secret = process.env.REVENUE_ACCESS_SECRET;
  if (!secret || !password) return false;
  
  const hash1 = crypto.createHash('sha256').update(password).digest();
  const hash2 = crypto.createHash('sha256').update(secret).digest();
  
  return crypto.timingSafeEqual(hash1, hash2);
}

export function createSessionCookieValue(overrideExp?: number): string {
  const secret = process.env.REVENUE_SESSION_SECRET;
  if (!secret) throw new Error('Missing REVENUE_SESSION_SECRET');

  const exp = overrideExp ?? (Date.now() + SESSION_DURATION_MS);
  const payload = exp.toString();
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  return `${payload}.${signature}`;
}

export function getSetCookieHeader(value: string, maxAgeMs: number): string {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const maxAgeSeconds = Math.floor(maxAgeMs / 1000);
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
}

export function verifySessionCookieValue(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = process.env.REVENUE_SESSION_SECRET;
  if (!secret) return false;

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const exp = parseInt(payload, 10);
  if (isNaN(exp) || exp < Date.now()) return false;

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  // Prevent timing attacks on signature comparison
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function requireRevenueSession(req: VercelRequest, res: VercelResponse): boolean {
  const cookieValue = req.cookies?.[COOKIE_NAME];
  if (!verifySessionCookieValue(cookieValue)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}
