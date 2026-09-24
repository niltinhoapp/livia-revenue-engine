import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRevenueSession } from '../src/auth.js';

const TIMEOUT_MS = 6000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // 1. MUST HAVE AUTHENTICATION
  if (!requireRevenueSession(req, res)) {
    return; // Response already sent inside the helper
  }

  // 2. CHECK INTERNAL CONFIGURATION
  const liviaUrl = process.env.LIVIA_INTERNAL_URL;
  const liviaSecret = process.env.LIVIA_API_SECRET;

  if (!liviaUrl || !liviaSecret) {
    return res.status(500).json({ ok: false, error: 'Internal configuration error' });
  }

  const { action, leadId, phone, businessName, segment, initialManualMessage, normalizedPhone } = req.body || {};

  // 3. VALIDATE ACTIONS AND FIELDS
  if (typeof action !== 'string' || !action) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing action' });
  }

  let fetchUrl = '';
  let fetchMethod = '';
  let fetchBody: string | undefined = undefined;

  if (action === 'get') {
    if (typeof leadId !== 'string' || !leadId) {
      return res.status(400).json({ ok: false, error: 'Missing leadId for get' });
    }
    fetchUrl = `${liviaUrl}/api/internal/prospecting?leadId=${encodeURIComponent(leadId)}`;
    fetchMethod = 'GET';
  } 
  else if (action === 'prepare') {
    if (
      typeof leadId !== 'string' || !leadId ||
      typeof phone !== 'string' || !phone ||
      typeof businessName !== 'string' || !businessName ||
      typeof segment !== 'string' || !segment ||
      typeof initialManualMessage !== 'string' || !initialManualMessage
    ) {
      return res.status(400).json({ ok: false, error: 'Missing required fields for prepare' });
    }
    fetchUrl = `${liviaUrl}/api/internal/prospecting`;
    fetchMethod = 'POST';
    fetchBody = JSON.stringify({
      leadId,
      phone,
      businessName,
      segment,
      initialManualMessage
    });
  } 
  else if (action === 'confirm_manual_send' || action === 'abort') {
    if (typeof normalizedPhone !== 'string' || !normalizedPhone || normalizedPhone.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Missing or invalid normalizedPhone' });
    }
    fetchUrl = `${liviaUrl}/api/internal/prospecting/${encodeURIComponent(normalizedPhone)}`;
    fetchMethod = 'PATCH';
    fetchBody = JSON.stringify({ action });
  } 
  else {
    return res.status(400).json({ ok: false, error: 'Unknown action' });
  }

  // 4. PREPARE UPSTREAM REQUEST
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fetchResponse = await fetch(fetchUrl, {
      method: fetchMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${liviaSecret}`
      },
      body: fetchBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const isJson = fetchResponse.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await fetchResponse.json() : await fetchResponse.text();
    const status = fetchResponse.status;

    // Preserve useful upstream statuses
    if ([200, 201, 400, 401, 404, 409].includes(status)) {
      // If Livia returned 401, it's a server-to-server auth issue, hide details
      if (status === 401) {
        return res.status(500).json({ ok: false, error: 'Upstream authorization error' });
      }
      return res.status(status).json(isJson ? responseData : { message: responseData });
    }

    // 500 or any other unhandled upstream status
    return res.status(502).json({ ok: false, error: 'Upstream error' });

  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Upstream timeout' });
    }
    return res.status(502).json({ ok: false, error: 'Upstream network error' });
  }
}
