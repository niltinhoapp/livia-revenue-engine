import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collectFromApify } from '../src/apify.js';
import { buildQueries } from '../src/queries.js';
import { ICP_SEGMENTS, type IcpSegment, type Lead, type RawPlace } from '../src/domain.js';
import { dedupeLeads, normalizePlace } from '../src/normalize.js';
import { qualifyAll } from '../src/qualify.js';

const DEFAULT_SEGMENT: IcpSegment = 'barbearia';

function parseSegment(value: unknown): IcpSegment {
  const segment = typeof value === 'string' ? value : DEFAULT_SEGMENT;
  return (ICP_SEGMENTS as readonly string[]).includes(segment) ? segment as IcpSegment : DEFAULT_SEGMENT;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        ok: false,
        error: 'Método não permitido. Use GET.',
      });
    }

    const city =
      typeof req.query.city === 'string'
        ? req.query.city
        : process.env.DEFAULT_CITY || 'Macatuba, SP, Brasil';

    const requestedMax =
      typeof req.query.max === 'string'
        ? Number(req.query.max)
        : 10;

    const max = Math.min(
      100,
      Math.max(10, Number.isFinite(requestedMax) ? requestedMax : 10),
    );

    const segment = parseSegment(req.query.segment);
    const queries = buildQueries(city, segment);

    const raw = await collectFromApify({
      queries,
      location: city,
      maxItems: max,
    });

    const normalized = raw
      .map((item: RawPlace) => normalizePlace(item, undefined, segment))
      .filter((lead): lead is Lead => Boolean(lead));

    const leads = qualifyAll(dedupeLeads(normalized)).slice(0, max);

    return res.status(200).json({
      ok: true,
      city,
      segment,
      requested: max,
      collected: raw.length,
      qualified: leads.filter((lead) => lead.stage === 'QUALIFICADO').length,
      leads,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    });
  }
}
