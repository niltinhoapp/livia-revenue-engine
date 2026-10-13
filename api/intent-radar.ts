import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRevenueSession } from '../src/auth.js';
import { assessIntent, type IntentSignal } from '../src/intent-radar.js';
import {
  scanRadarOpportunities,
  RADAR_DEFAULT_QUERIES,
} from '../src/intent-radar-search.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use GET or POST.' });
  }

  // 1. Session verification
  if (!requireRevenueSession(req, res)) {
    return; // Response 401 already sent by requireRevenueSession
  }

  try {
    // Handling GET: scan with query params
    if (req.method === 'GET') {
      const queryParam = typeof req.query.query === 'string' ? req.query.query.trim() : '';
      const segmentParam = typeof req.query.segment === 'string' ? req.query.segment.trim() : undefined;
      const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : 15;
      const includeAll = req.query.includeAll === '1' || req.query.includeAll === 'true';

      const scanResult = await scanRadarOpportunities({
        query: queryParam || undefined,
        segment: segmentParam || undefined,
        limitPerConnector: Number.isFinite(limitParam) ? Math.min(30, Math.max(5, limitParam)) : 15,
        includeLowAndDiscarded: includeAll,
      });

      return res.status(200).json({
        ...scanResult,
        presets: RADAR_DEFAULT_QUERIES,
      });
    }

    // Handling POST: action-based or direct signals assessment
    const body = req.body || {};
    const action = typeof body.action === 'string' ? body.action : undefined;

    // Presets request
    if (action === 'presets') {
      return res.status(200).json({
        ok: true,
        presets: RADAR_DEFAULT_QUERIES,
      });
    }

    // Scan request via POST
    if (action === 'scan' || action === 'search') {
      const query = typeof body.query === 'string' ? body.query.trim() : '';
      const segment = typeof body.segment === 'string' ? body.segment.trim() : undefined;
      const limit = typeof body.limit === 'number' ? body.limit : 15;
      const includeLowAndDiscarded = Boolean(body.includeLowAndDiscarded);

      const scanResult = await scanRadarOpportunities({
        query: query || undefined,
        segment: segment || undefined,
        limitPerConnector: Math.min(30, Math.max(5, limit)),
        includeLowAndDiscarded,
      });

      return res.status(200).json({
        ...scanResult,
        presets: RADAR_DEFAULT_QUERIES,
      });
    }

    // Direct signals assessment (preserves backward compatibility)
    const signals = Array.isArray(body.signals) ? body.signals : undefined;
    if (signals) {
      if (signals.length < 1 || signals.length > 50) {
        return res.status(400).json({ ok: false, error: 'Provide 1-50 signals' });
      }

      if (
        signals.some(
          (s: IntentSignal) =>
            !s ||
            typeof s.text !== 'string' ||
            typeof s.sourceUrl !== 'string' ||
            s.text.length > 8000 ||
            s.sourceUrl.length > 2048,
        )
      ) {
        return res.status(400).json({ ok: false, error: 'Invalid signal fields' });
      }

      const results = signals.map((s: IntentSignal) => assessIntent(s));
      return res.status(200).json({
        ok: true,
        mode: 'manual-review-only',
        analyzed: signals.length,
        results,
      });
    }

    return res.status(400).json({
      ok: false,
      error: 'Invalid request. Specify "signals" array or action "scan".',
    });
  } catch (error) {
    console.error('Intent radar error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal radar error',
    });
  }
}
