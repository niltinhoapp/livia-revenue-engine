import type { Lead } from './domain.js';

export type AutomationSignal = 'PROBABLE' | 'POSSIBLE' | 'NOT_DETECTED' | 'UNVERIFIED';

export interface AutomationInsight {
  signal: AutomationSignal;
  score: number;
  evidence: string[];
  checkedWebsite: boolean;
}

const AUTOMATION_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  { pattern: /chatbot|chat bot|chat\s*online|assistente virtual|atendimento virtual|agente de ia|agente ia/i, label: 'chatbot ou assistente virtual identificado no site', weight: 4 },
  { pattern: /jivochat|zendesk|intercom|tawk\.to|crisp\.chat|take\.blip|blip\.ai|huggy|zenvia|manychat|respond\.io|kommo|rd station|rdstation/i, label: 'plataforma de atendimento/automação identificada no site', weight: 4 },
  { pattern: /whatsapp.{0,80}(menu|op[cç][aã]o|automat|bot|rob[oô]|assistente)|menu.{0,80}whatsapp|whatsapp.{0,80}(1\s*[-.)]|2\s*[-.)]|3\s*[-.)])/i, label: 'indício de fluxo automatizado relacionado ao WhatsApp', weight: 3 },
  { pattern: /resposta autom[aá]tica|mensagem autom[aá]tica|fora do hor[aá]rio|digite\s+(1|2|3|4|5)|selecione\s+(uma|uma op[cç][aã]o)|como podemos ajudar/i, label: 'texto público com sinais de atendimento automatizado', weight: 2 },
  { pattern: /agendamento.{0,80}(online|autom[aá]tico)|booking|booksy|fresha|simples dental|doctoralia/i, label: 'ferramenta de agendamento identificada', weight: 1 },
];

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchWebsite(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'LiviaRevenueEngine/1.0 commercial-signal-check' },
    });
    if (!response.ok) return '';
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return '';
    return (await response.text()).slice(0, 250_000);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

export async function inspectAutomation(lead: Lead): Promise<AutomationInsight> {
  const url = lead.website ? normalizeUrl(lead.website) : null;
  if (!url) {
    return { signal: 'UNVERIFIED', score: 0, evidence: ['Sem site público para analisar automaticamente'], checkedWebsite: false };
  }

  const html = await fetchWebsite(url);
  if (!html) {
    return { signal: 'UNVERIFIED', score: 0, evidence: ['Site não pôde ser analisado automaticamente'], checkedWebsite: true };
  }

  const evidence: string[] = [];
  let score = 0;
  for (const item of AUTOMATION_PATTERNS) {
    if (item.pattern.test(html)) {
      score += item.weight;
      if (!evidence.includes(item.label)) evidence.push(item.label);
    }
  }

  const signal: AutomationSignal = score >= 4 ? 'PROBABLE' : score >= 2 ? 'POSSIBLE' : 'NOT_DETECTED';
  return {
    signal,
    score,
    evidence: evidence.length ? evidence.slice(0, 4) : ['Nenhum sinal público de automação identificado no site'],
    checkedWebsite: true,
  };
}

export async function enrichAutomationSignals(leads: Lead[], maxChecks = 20): Promise<Lead[]> {
  const candidates = leads.filter((lead) => Boolean(lead.website)).slice(0, maxChecks);
  const results = await Promise.all(candidates.map(async (lead) => [lead.id, await inspectAutomation(lead)] as const));
  const byId = new Map(results);

  return leads.map((lead) => {
    const insight = byId.get(lead.id);
    if (!insight) return lead;
    return { ...lead, automationSignal: insight.signal, automationScore: insight.score, automationEvidence: insight.evidence, automationCheckedAt: new Date().toISOString() };
  });
}
