import { ApifyClient } from 'apify-client';
import type { RawPlace } from './domain.js';

export interface CollectOptions {
  queries: string[];
  maxItems?: number;
  actor?: string;
}

export async function collectFromApify(options: CollectOptions): Promise<RawPlace[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN não configurado.');

  const actor = options.actor || process.env.APIFY_ACTOR || 'compass/crawler-google-places';
  const client = new ApifyClient({ token });

  const run = await client.actor(actor).call({
    searchStringsArray: options.queries,
    maxCrawledPlacesPerSearch: options.maxItems ?? 100,
    language: 'pt-BR',
    countryCode: 'br',
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems({
    limit: options.maxItems ?? 100,
  });

  return items as RawPlace[];
}
