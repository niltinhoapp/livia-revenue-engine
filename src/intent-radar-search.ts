/**
 * Motor modular de busca de sinais de intenção comercial pública.
 * Inspiração arquitetural: LeadHunterOS (signal-first discovery, deterministic scoring, modular connectors).
 * Fontes públicas e gratuitas com acesso permitido, sem disparos automáticos.
 */

import {
  type IntentAssessment,
  type IntentSignal,
  assessIntent,
  isValidPublicUrl,
} from './intent-radar.js';

export interface ConnectorResult {
  connectorId: string;
  connectorName: string;
  signals: IntentSignal[];
  limitation?: string;
}

export interface IntentSearchConnector {
  readonly id: string;
  readonly name: string;
  search(query: string, limit?: number): Promise<ConnectorResult>;
}

export const RADAR_DEFAULT_QUERIES = [
  'sistema de agendamento salão',
  'sistema de agendamento barbearia',
  'app agendamento manicure',
  'atendimento no WhatsApp salão',
  'preciso automatizar WhatsApp',
  'alguém indica sistema de agendamento',
  'não consigo responder meus clientes',
  'procuro recepcionista virtual',
  'perdendo clientes demora WhatsApp',
] as const;

export class PullpushRedditConnector implements IntentSearchConnector {
  readonly id = 'reddit_pullpush';
  readonly name = 'Reddit (Comunidades Públicas)';

  async search(query: string, limit = 15): Promise<ConnectorResult> {
    const signals: IntentSignal[] = [];
    let limitation: string | undefined;

    try {
      // 1. Search submissions
      const subUrl = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(query)}&size=${Math.min(limit, 20)}`;
      const subRes = await fetch(subUrl, {
        headers: { 'User-Agent': 'LiviaRevenueEngine/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (subRes.ok) {
        const subData = (await subRes.json()) as { data?: Array<Record<string, unknown>> };
        for (const item of subData.data || []) {
          const title = typeof item.title === 'string' ? item.title : '';
          const selftext = typeof item.selftext === 'string' ? item.selftext : '';
          const permalink = typeof item.permalink === 'string' ? item.permalink : '';
          const url = typeof item.url === 'string' ? item.url : '';
          const sourceUrl = permalink ? `https://reddit.com${permalink}` : url;
          const author = typeof item.author === 'string' ? item.author : undefined;
          const createdUtc = typeof item.created_utc === 'number' ? item.created_utc : undefined;

          if (isValidPublicUrl(sourceUrl) && (title || selftext)) {
            signals.push({
              source: 'Reddit',
              sourceUrl,
              title,
              text: `${title}\n\n${selftext}`.trim(),
              author,
              publishedAt: createdUtc ? new Date(createdUtc * 1000).toISOString() : undefined,
            });
          }
        }
      } else {
        limitation = `Reddit API retornou status ${subRes.status}`;
      }

      // 2. Search comments for real conversational questions
      const commentLimit = Math.max(5, Math.floor(limit / 2));
      const commentUrl = `https://api.pullpush.io/reddit/search/comment/?q=${encodeURIComponent(query)}&size=${commentLimit}`;
      const commentRes = await fetch(commentUrl, {
        headers: { 'User-Agent': 'LiviaRevenueEngine/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (commentRes.ok) {
        const commentData = (await commentRes.json()) as { data?: Array<Record<string, unknown>> };
        for (const item of commentData.data || []) {
          const body = typeof item.body === 'string' ? item.body : '';
          const permalink = typeof item.permalink === 'string' ? item.permalink : '';
          const sourceUrl = permalink ? `https://reddit.com${permalink}` : '';
          const author = typeof item.author === 'string' ? item.author : undefined;
          const createdUtc = typeof item.created_utc === 'number' ? item.created_utc : undefined;

          if (isValidPublicUrl(sourceUrl) && body.length >= 20) {
            signals.push({
              source: 'Reddit (Comentário)',
              sourceUrl,
              title: `Comentário em r/${String(item.subreddit || 'reddit')}`,
              text: body.trim(),
              author,
              publishedAt: createdUtc ? new Date(createdUtc * 1000).toISOString() : undefined,
            });
          }
        }
      }
    } catch (err) {
      limitation = `Conexão Reddit indisponível ou tempo limite atingido (${err instanceof Error ? err.message : 'timeout'})`;
    }

    return {
      connectorId: this.id,
      connectorName: this.name,
      signals,
      limitation,
    };
  }
}

export class GoogleNewsConnector implements IntentSearchConnector {
  readonly id = 'google_news';
  readonly name = 'Google Notícias (Publicações PT-BR)';

  async search(query: string, limit = 20): Promise<ConnectorResult> {
    const signals: IntentSignal[] = [];
    let limitation: string | undefined;

    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LiviaRevenueEngine/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const xml = await res.text();
        const items = [
          ...xml.matchAll(
            /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/g,
          ),
        ].slice(0, limit);

        for (const item of items) {
          const rawTitle = item[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const sourceUrl = item[2].trim();
          const pubDate = item[3].trim();
          const rawDesc = item[4]
            .replace(/<[^>]+>/g, '')
            .replace(/<!\[CDATA\[|\]\]>/g, '')
            .trim();

          if (isValidPublicUrl(sourceUrl)) {
            signals.push({
              source: 'Google Notícias',
              sourceUrl,
              title: rawTitle,
              text: `${rawTitle}\n\n${rawDesc}`.trim(),
              publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
            });
          }
        }
      } else {
        limitation = `Google News retornou status ${res.status}`;
      }
    } catch (err) {
      limitation = `Google News indisponível (${err instanceof Error ? err.message : 'timeout'})`;
    }

    return {
      connectorId: this.id,
      connectorName: this.name,
      signals,
      limitation,
    };
  }
}

export class GitHubDiscussionsConnector implements IntentSearchConnector {
  readonly id = 'github_public';
  readonly name = 'GitHub Discussões & Issues Públicas';

  async search(query: string, limit = 10): Promise<ConnectorResult> {
    const signals: IntentSignal[] = [];
    let limitation: string | undefined;

    try {
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query + ' in:title,body')}&per_page=${Math.min(limit, 15)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'LiviaRevenueEngine/1.0',
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = (await res.json()) as { items?: Array<Record<string, unknown>> };
        for (const item of json.items || []) {
          const title = typeof item.title === 'string' ? item.title : '';
          const body = typeof item.body === 'string' ? item.body : '';
          const htmlUrl = typeof item.html_url === 'string' ? item.html_url : '';
          const userObj = item.user as Record<string, unknown> | undefined;
          const author = typeof userObj?.login === 'string' ? userObj.login : undefined;
          const createdAt = typeof item.created_at === 'string' ? item.created_at : undefined;

          if (isValidPublicUrl(htmlUrl) && (title || body)) {
            signals.push({
              source: 'GitHub',
              sourceUrl: htmlUrl,
              title,
              text: `${title}\n\n${body}`.trim(),
              author,
              publishedAt: createdAt,
            });
          }
        }
      } else if (res.status === 403) {
        limitation = 'Limite de requisições públicas do GitHub atingido (tente novamente em instantes)';
      } else {
        limitation = `GitHub retornou status ${res.status}`;
      }
    } catch (err) {
      limitation = `GitHub indisponível (${err instanceof Error ? err.message : 'timeout'})`;
    }

    return {
      connectorId: this.id,
      connectorName: this.name,
      signals,
      limitation,
    };
  }
}

export class GoogleSearchConnector implements IntentSearchConnector {
  readonly id = 'google_custom_search';
  readonly name = 'Google Custom Search (Oficial)';

  async search(query: string, limit = 10): Promise<ConnectorResult> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return {
        connectorId: this.id,
        connectorName: this.name,
        signals: [],
        limitation: 'Não configurado (chave GOOGLE_SEARCH_API_KEY ou GOOGLE_SEARCH_CX ausente)',
      };
    }

    const signals: IntentSignal[] = [];
    let limitation: string | undefined;

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${Math.min(limit, 10)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<Record<string, unknown>> };
        for (const item of data.items || []) {
          const title = typeof item.title === 'string' ? item.title : '';
          const snippet = typeof item.snippet === 'string' ? item.snippet : '';
          const link = typeof item.link === 'string' ? item.link : '';

          if (isValidPublicUrl(link)) {
            signals.push({
              source: 'Google Search',
              sourceUrl: link,
              title,
              text: `${title}\n\n${snippet}`.trim(),
            });
          }
        }
      } else {
        limitation = `Google Custom Search retornou status ${res.status}`;
      }
    } catch (err) {
      limitation = `Google Custom Search indisponível (${err instanceof Error ? err.message : 'timeout'})`;
    }

    return {
      connectorId: this.id,
      connectorName: this.name,
      signals,
      limitation,
    };
  }
}

export interface RadarScanOptions {
  query?: string;
  segment?: string;
  limitPerConnector?: number;
  connectors?: IntentSearchConnector[];
  customSignals?: IntentSignal[];
  includeLowAndDiscarded?: boolean;
}

export interface RadarScanSummary {
  ok: boolean;
  query: string;
  segment?: string;
  totalSignalsCollected: number;
  uniqueSignals: number;
  qualifiedOpportunitiesCount: number;
  highIntentCount: number;
  mediumIntentCount: number;
  lowIntentCount: number;
  discardedCount: number;
  opportunities: IntentAssessment[];
  sourceLimitations: string[];
  queriedSources: string[];
  collectedAt: string;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove query tracking params
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('oc');
    u.hash = '';
    return u.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function deduplicateSignals(signals: IntentSignal[]): IntentSignal[] {
  const seenUrls = new Set<string>();
  const seenTexts = new Set<string>();
  const unique: IntentSignal[] = [];

  for (const s of signals) {
    const normUrl = normalizeUrl(s.sourceUrl);
    const textPreview = s.text.trim().slice(0, 100).toLowerCase();

    if (seenUrls.has(normUrl) || seenTexts.has(textPreview)) {
      continue;
    }
    seenUrls.add(normUrl);
    seenTexts.add(textPreview);
    unique.push(s);
  }

  return unique;
}

export async function scanRadarOpportunities(options: RadarScanOptions = {}): Promise<RadarScanSummary> {
  const query = (options.query || 'sistema de agendamento barbearia OR salao atendimento WhatsApp').trim();
  const limit = options.limitPerConnector || 15;

  const defaultConnectors: IntentSearchConnector[] = [
    new PullpushRedditConnector(),
    new GoogleNewsConnector(),
    new GitHubDiscussionsConnector(),
    new GoogleSearchConnector(),
  ];

  const connectors = options.connectors || defaultConnectors;
  const sourceLimitations: string[] = [];
  const queriedSources: string[] = [];
  const collectedSignals: IntentSignal[] = [...(options.customSignals || [])];

  const results = await Promise.allSettled(
    connectors.map(async (c) => {
      queriedSources.push(c.name);
      return c.search(query, limit);
    }),
  );

  for (const res of results) {
    if (res.status === 'fulfilled') {
      collectedSignals.push(...res.value.signals);
      if (res.value.limitation) {
        sourceLimitations.push(`${res.value.connectorName}: ${res.value.limitation}`);
      }
    } else {
      sourceLimitations.push(`Erro inesperado em conector: ${res.reason instanceof Error ? res.reason.message : String(res.reason)}`);
    }
  }

  const uniqueSignals = deduplicateSignals(collectedSignals);

  // Qualify & score each signal deterministically
  const assessed = uniqueSignals.map((signal) => {
    if (options.segment && !signal.segment) {
      signal.segment = options.segment;
    }
    return assessIntent(signal);
  });

  // Sort: HIGH first, then MEDIUM, then LOW. Higher scores first, higher urgency first.
  const levelRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
  const urgencyRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  assessed.sort((a, b) => {
    const rankDiff = (levelRank[b.level] || 0) - (levelRank[a.level] || 0);
    if (rankDiff !== 0) return rankDiff;
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    const urgDiff = (urgencyRank[b.urgency] || 0) - (urgencyRank[a.urgency] || 0);
    if (urgDiff !== 0) return urgDiff;
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const high = assessed.filter((a) => a.level === 'HIGH');
  const medium = assessed.filter((a) => a.level === 'MEDIUM');
  const low = assessed.filter((a) => a.level === 'LOW');
  const none = assessed.filter((a) => a.level === 'NONE');

  const filteredOpportunities = options.includeLowAndDiscarded
    ? assessed
    : assessed.filter((a) => a.level !== 'NONE');

  return {
    ok: true,
    query,
    segment: options.segment,
    totalSignalsCollected: collectedSignals.length,
    uniqueSignals: uniqueSignals.length,
    qualifiedOpportunitiesCount: high.length + medium.length,
    highIntentCount: high.length,
    mediumIntentCount: medium.length,
    lowIntentCount: low.length,
    discardedCount: none.length,
    opportunities: filteredOpportunities,
    sourceLimitations,
    queriedSources,
    collectedAt: new Date().toISOString(),
  };
}
