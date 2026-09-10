import type { CrmEvent, CrmEventType, PipelineStage } from './domain.js';

export function createCrmEvent(
  leadId: string,
  type: CrmEventType,
  details: Omit<CrmEvent, 'id' | 'leadId' | 'type' | 'occurredAt'> = {},
  now = new Date(),
): CrmEvent {
  return {
    id: `evt-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    leadId,
    type,
    occurredAt: now.toISOString(),
    ...details,
  };
}

export function isTerminalStage(stage: PipelineStage): boolean {
  return stage === 'GANHO' || stage === 'PERDIDO' || stage === 'OPT-OUT';
}

export function canChangeStage(fromStage: PipelineStage, toStage: PipelineStage): boolean {
  if (fromStage === toStage) return false;
  if (fromStage === 'OPT-OUT') return false;
  if (toStage === 'NOVO') return false;
  return true;
}
