import { ApifyClient } from 'apify-client';
import type { RawPlace } from './domain.js';

export interface CollectOptions {
  queries: string[];
  location: string;
  maxItems?: number;
  actor?: string;
}

export async function collectFromApify(options: CollectOptions): Promise<RawPlace[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN não configurado.');

  const actor = options.actor || process.env.APIFY_ACTOR || 'compass/crawler-google-places';
  const client = new ApifyClient({ token });
  const total = Math.max(1, options.maxItems ?? 100);
  const perSearch = Math.max(1, Math.ceil(total / options.queries.length));

  const run = await client.actor(actor).call({
    searchStringsArray: options.queries,
    locationQuery: options.location,
    maxCrawledPlacesPerSearch: perSearch,
    language: 'pt-BR',
    countryCode: 'br',
    scrapeSocialMediaProfiles: {
      facebooks: false,
      instagrams: false,
      youtubes: false,
      tiktoks: false,
      twitters: false,
    },
    maximumLeadsEnrichmentRecords: 0,
    maxCompetitorsToAnalyze: 0,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems({
    limit: total,
  });

  return items as RawPlace[];
}
