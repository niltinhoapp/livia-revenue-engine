import type { Lead } from './domain.js';

export function qualifyLead(lead: Lead): Lead {
  let score = 0;
  const reasons: string[] = [];

  if (lead.segment) {
    score += 40;
    reasons.push('segmento dentro do ICP');
  }

  if (lead.phone) {
    score += 25;
    reasons.push('telefone disponível');
  }

  if (lead.website) {
    score += 10;
    reasons.push('presença digital');
  }

  if (lead.reviews !== null && lead.reviews >= 20) {
    score += 10;
    reasons.push('volume de avaliações indica operação ativa');
  }

  if (lead.reviews !== null && lead.reviews >= 100) {
    score += 5;
    reasons.push('forte sinal de volume');
  }

  if (lead.rating !== null && lead.rating >= 4) {
    score += 5;
    reasons.push('boa reputação');
  }

  if (lead.city) {
    score += 5;
    reasons.push('localização identificada');
  }

  return {
    ...lead,
    score: Math.min(score, 100),
    scoreReasons: reasons,
    stage: score >= 60 && !lead.optOut ? 'QUALIFICADO' : 'NOVO',
    updatedAt: new Date().toISOString(),
  };
}

export function qualifyAll(leads: Lead[]): Lead[] {
  return leads.map(qualifyLead).sort((a, b) => b.score - a.score);
}
