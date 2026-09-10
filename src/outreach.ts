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
 * A phone must be structurally valid and manually/independently verified
 * before WhatsApp contact can be considered ready.
 */
export function buildOutreachQueue(leads: Lead[]): OutreachItem[] {
  return leads
    .filter((lead) => lead.stage === 'QUALIFICADO')
    .sort((a, b) => b.score - a.score)
    .map((lead) => {
      if (lead.optOut) {
        return {
          leadId: lead.id, company: lead.name, segment: lead.segment, phone: lead.phone,
          message: lead.personalizedMessage, stage: lead.stage, score: lead.score,
          eligible: false, reason: 'OPT-OUT registrado',
        };
      }

      if (!lead.phone) {
        return {
          leadId: lead.id, company: lead.name, segment: lead.segment, phone: null,
          message: lead.personalizedMessage, stage: lead.stage, score: lead.score,
          eligible: false, reason: 'sem telefone',
        };
      }

      if (lead.phoneStatus === 'REJECTED') {
        return {
          leadId: lead.id, company: lead.name, segment: lead.segment, phone: null,
          message: lead.personalizedMessage, stage: lead.stage, score: lead.score,
          eligible: false, reason: 'telefone rejeitado por validação estrutural',
        };
      }

      if (lead.phoneStatus !== 'VERIFIED') {
        return {
          leadId: lead.id, company: lead.name, segment: lead.segment, phone: lead.phone,
          message: lead.personalizedMessage, stage: lead.stage, score: lead.score,
          eligible: false, reason: 'telefone encontrado, mas ainda não verificado',
        };
      }

      if (!lead.personalizedMessage) {
        return {
          leadId: lead.id, company: lead.name, segment: lead.segment, phone: lead.phone,
          message: null, stage: lead.stage, score: lead.score,
          eligible: false, reason: 'mensagem ainda não personalizada',
        };
      }

      return {
        leadId: lead.id, company: lead.name, segment: lead.segment, phone: lead.phone,
        message: lead.personalizedMessage, stage: lead.stage, score: lead.score,
        eligible: false, reason: 'aguardando validação do canal e autorização de contato',
      };
    });
}
