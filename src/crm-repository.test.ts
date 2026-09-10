import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryCrmRepository } from './crm-repository.js';
import type { Lead } from './domain.js';

const lead: Lead = {
  id: 'lead-1',
  name: 'Barbearia Teste',
  segment: 'barbearia',
  city: 'Macatuba',
  state: 'SP',
  country: 'Brasil',
  address: 'Rua Teste, 10',
  phone: '5514999999999',
  whatsapp: null,
  phoneStatus: 'VERIFIED',
  website: null,
  googleMapsUrl: null,
  rating: 4.8,
  reviews: 120,
  source: 'manual',
  sourceId: null,
  dataQualityScore: 90,
  dataQualityReasons: [],
  score: 80,
  scoreReasons: [],
  stage: 'QUALIFICADO',
  optOut: false,
  contactedAt: null,
  lastContactAt: null,
  personalizedMessage: null,
  notes: null,
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
};

test('CRM repository stores and retrieves lead state', async () => {
  const repository = new InMemoryCrmRepository();
  await repository.saveLead(lead);

  const stored = await repository.getLead(lead.id);
  assert.deepEqual(stored, lead);
  assert.equal(await repository.getLead('missing'), null);
});

test('CRM repository stores events per lead in chronological order', async () => {
  const repository = new InMemoryCrmRepository();

  await repository.appendEvent({
    id: 'evt-2',
    leadId: lead.id,
    type: 'CONTACTED',
    occurredAt: '2026-09-10T10:00:00.000Z',
  });
  await repository.appendEvent({
    id: 'evt-1',
    leadId: lead.id,
    type: 'MESSAGE_PREPARED',
    occurredAt: '2026-09-10T09:00:00.000Z',
  });
  await repository.appendEvent({
    id: 'evt-other',
    leadId: 'other-lead',
    type: 'NOTE_ADDED',
    occurredAt: '2026-09-10T08:00:00.000Z',
  });

  const events = await repository.listEventsByLead(lead.id);
  assert.deepEqual(events.map((event) => event.id), ['evt-1', 'evt-2']);
});
