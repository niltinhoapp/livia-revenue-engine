import type { Lead, PipelineStage } from './domain.js';

const TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  'NOVO': ['QUALIFICADO', 'OPT-OUT'],
  'QUALIFICADO': ['CONTATADO', 'OPT-OUT'],
  'CONTATADO': ['RESPONDEU', 'OPT-OUT', 'PERDIDO'],
  'RESPONDEU': ['INTERESSADO', 'PERDIDO', 'OPT-OUT'],
  'INTERESSADO': ['DEMONSTRAÇÃO', 'PERDIDO', 'OPT-OUT'],
  'DEMONSTRAÇÃO': ['PROPOSTA', 'PERDIDO', 'OPT-OUT'],
  'PROPOSTA': ['NEGOCIAÇÃO', 'GANHO', 'PERDIDO', 'OPT-OUT'],
  'NEGOCIAÇÃO': ['GANHO', 'PERDIDO', 'OPT-OUT'],
  'GANHO': [],
  'PERDIDO': ['QUALIFICADO'],
  'OPT-OUT': [],
};

export function canTransition(from: PipelineStage, to: PipelineStage): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function transitionLead(lead: Lead, to: PipelineStage, note?: string): Lead {
  if (!canTransition(lead.stage, to)) {
    throw new Error(`Transição inválida: ${lead.stage} → ${to}`);
  }

  const now = new Date().toISOString();
  return {
    ...lead,
    stage: to,
    contactedAt: to === 'CONTATADO' && !lead.contactedAt ? now : lead.contactedAt,
    lastContactAt: to === 'CONTATADO' ? now : lead.lastContactAt,
    notes: note ? [lead.notes, note].filter(Boolean).join('\n') : lead.notes,
    updatedAt: now,
  };
}

export function funnelSummary(leads: Lead[]): Record<PipelineStage, number> {
  const summary = {} as Record<PipelineStage, number>;
  for (const lead of leads) summary[lead.stage] = (summary[lead.stage] || 0) + 1;
  return summary;
}
