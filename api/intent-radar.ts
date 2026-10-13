import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRevenueSession } from '../src/auth.js';
import { assessIntent } from '../src/intent-radar.js';
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!requireRevenueSession(req, res)) return;
  const signals = req.body?.signals;
  if (!Array.isArray(signals) || signals.length < 1 || signals.length > 30) return res.status(400).json({ ok: false, error: 'Provide 1-30 signals' });
  if (signals.some(s => !s || typeof s.text !== 'string' || typeof s.sourceUrl !== 'string' || s.text.length > 6000 || s.sourceUrl.length > 2048)) return res.status(400).json({ ok: false, error: 'Invalid signal fields' });
  return res.status(200).json({ ok: true, mode: 'manual-review-only', analyzed: signals.length, results: signals.map(assessIntent) });
}
