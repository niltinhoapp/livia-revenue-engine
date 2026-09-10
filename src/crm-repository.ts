import type { CrmEvent, Lead } from './domain.js';

/**
 * Persistence boundary for CRM data.
 *
 * The application must depend on this contract instead of a filesystem or
 * browser storage implementation. A remote database adapter can implement
 * the same contract later without changing CRM rules or UI behavior.
 */
export interface CrmRepository {
  appendEvent(event: CrmEvent): Promise<void>;
  listEventsByLead(leadId: string): Promise<CrmEvent[]>;
  saveLead(lead: Lead): Promise<void>;
  getLead(leadId: string): Promise<Lead | null>;
}

/** Simple adapter for tests and local orchestration. */
export class InMemoryCrmRepository implements CrmRepository {
  private readonly events: CrmEvent[] = [];
  private readonly leads = new Map<string, Lead>();

  async appendEvent(event: CrmEvent): Promise<void> {
    this.events.push(event);
  }

  async listEventsByLead(leadId: string): Promise<CrmEvent[]> {
    return this.events
      .filter((event) => event.leadId === leadId)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async saveLead(lead: Lead): Promise<void> {
    this.leads.set(lead.id, lead);
  }

  async getLead(leadId: string): Promise<Lead | null> {
    return this.leads.get(leadId) ?? null;
  }
}
