import type { Lead } from './domain.js';

export interface OutreachItem {
  leadId: string;
  company: string;
  segment: string | null;
  phone: string | null;
  message: string | null;
  stage: Lead['stage'];
  score: number;
  eligible: boolean;
  reason: string;
}

/**
 * Builds a reviewable outreach queue. It intentionally does not send messages.
 * Sending must happen only through a channel and process that satisfies the
 * applicable consent, legal-basis, platform-policy and opt-out requirements.
 */
export function buildOutreachQueue(leads: Lead[]): OutreachItem[] {
  return leads
    .filter((lead) => lead.stage === 'QUALIFICADO')
    .sort((a, b) => b.score - a.score)
    .map((lead) => {
      if (lead.optOut) {
        return {
          leadId: lead.id,
          company: lead.name,
          segment: lead.segment,
          phone: lead.phone,
          message: lead.personalizedMessage,
          stage: lead.stage,
          score: lead.score,
          eligible: false,
          reason: 'OPT-OUT registrado',
        };
      }

      if (!lead.phone) {
        return {
          leadId: lead.id,
          company: lead.name,
          segment: lead.segment,
          phone: null,
          message: lead.personalizedMessage,
          stage: lead.stage,
          score: lead.score,
          eligible: false,
          reason: 'sem telefone',
        };
      }

      if (!lead.personalizedMessage) {
        return {
          leadId: lead.id,
          company: lead.name,
          segment: lead.segment,
          phone: lead.phone,
          message: null,
          stage: lead.stage,
          score: lead.score,
          eligible: false,
          reason: 'mensagem ainda não personalizada',
        };
      }

      return {
        leadId: lead.id,
        company: lead.name,
        segment: lead.segment,
        phone: lead.phone,
        message: lead.personalizedMessage,
        stage: lead.stage,
        score: lead.score,
        eligible: false,
        reason: 'aguardando validação do canal e autorização de contato',
      };
    });
}
