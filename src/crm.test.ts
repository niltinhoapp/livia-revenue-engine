import test from 'node:test';
import assert from 'node:assert/strict';
import { CRM_EVENT_TYPES, type CrmEvent } from './domain.js';

const event: CrmEvent = {
  id: 'evt-1',
  leadId: 'lead-1',
  type: 'CONTACTED',
  occurredAt: '2026-09-09T12:00:00.000Z',
  fromStage: 'QUALIFICADO',
  toStage: 'CONTATADO',
  message: 'Olá!',
};

test('CRM event model supports auditable contact history', () => {
  assert.ok(CRM_EVENT_TYPES.includes(event.type));
  assert.equal(event.leadId, 'lead-1');
  assert.equal(event.fromStage, 'QUALIFICADO');
  assert.equal(event.toStage, 'CONTATADO');
  assert.ok(event.occurredAt);
});

test('CRM event types include the commercial lifecycle needed by the engine', () => {
  assert.deepEqual(CRM_EVENT_TYPES, [
    'LEAD_CREATED',
    'LEAD_UPDATED',
    'PHONE_VERIFIED',
    'PHONE_REJECTED',
    'MESSAGE_PREPARED',
    'CONTACTED',
    'STAGE_CHANGED',
    'NOTE_ADDED',
    'OPT_OUT',
  ]);
});
