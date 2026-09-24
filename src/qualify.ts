import type { Lead } from './domain.js';

const FRANCHISE_PATTERN = /smart fit|espa[cç]olaser|botic[aá]rio|odonto.?company|sorridents/i;

export function qualifyLead(lead: Lead): Lead {
  let score = 0;
  const reasons: string[] = [];

  // Segmento base
  if (lead.segment) {
    score += 30;
    reasons.push('segmento dentro do ICP');
  }

  // Contato telefônico
  if (lead.phoneStatus === 'VERIFIED') {
    score += 20;
    reasons.push('telefone validado');
  } else if (lead.phoneStatus === 'NEEDS_REVIEW') {
    score += 10;
    reasons.push('telefone encontrado, mas precisa validação');
  }

  // Presença Digital
  if (lead.website) {
    score += 5;
    reasons.push('site encontrado');
  }

  // Volume de Avaliações / Movimentação
  if (lead.reviews !== null) {
    if (lead.reviews >= 100) {
      score += 20;
      reasons.push('alto volume de avaliações');
    } else if (lead.reviews >= 21) {
      score += 10;
      reasons.push('volume médio de avaliações');
    } else if (lead.reviews >= 5) {
      score += 5;
      reasons.push('poucas avaliações');
    } else {
      reasons.push('avaliações insuficientes para pontuar movimento');
    }
  }

  // Sinais de Automação
  if (lead.automationSignal === 'NOT_DETECTED') {
    if (lead.reviews !== null && lead.reviews >= 50) {
      score += 15;
      reasons.push('automação não detectada combinada com alto volume');
    } else {
      score += 5;
      reasons.push('automação não detectada');
    }
  } else if (lead.automationSignal === 'POSSIBLE') {
    score += 10;
    reasons.push('WhatsApp disponível ou possível link de atendimento');
  } else if (lead.automationSignal === 'PROBABLE') {
    score += 5;
    reasons.push('automação provável detectada');
  }

  // Filtro Anti-Franquias / Grandes Redes
  if (FRANCHISE_PATTERN.test(lead.name)) {
    score -= 50;
    reasons.push('possível rede/franquia');
  }

  return {
    ...lead,
    score: score,
    scoreReasons: reasons,
    stage: score >= 60 && !lead.optOut ? 'QUALIFICADO' : 'NOVO',
    updatedAt: new Date().toISOString(),
  };
}

export function qualifyAll(leads: Lead[]): Lead[] {
  return leads.map(qualifyLead).sort((a, b) => b.score - a.score);
}
