import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyPassword,
  createSessionCookieValue,
  getSetCookieHeader,
  verifySessionCookieValue,
  _setEnv
} from '../src/auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { action, password } = req.body || {};

  if (action === 'logout') {
    res.setHeader('Set-Cookie', getSetCookieHeader('', 0));
    return res.status(200).json({ ok: true });
  }

  if (action === 'verify') {
    const isValid = verifySessionCookieValue(req.cookies?.['revenuesid']);
    return res.status(200).json({ ok: true, valid: isValid });
  }

  if (action === 'login') {
    if (verifyPassword(password)) {
      const cookieValue = createSessionCookieValue();
      const maxAgeMs = 12 * 60 * 60 * 1000;
      res.setHeader('Set-Cookie', getSetCookieHeader(cookieValue, maxAgeMs));
      return res.status(200).json({ ok: true });
    }
    
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  return res.status(400).json({ ok: false, error: 'Invalid action' });
}
