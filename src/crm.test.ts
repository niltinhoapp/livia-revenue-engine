import test from 'node:test';
import assert from 'node:assert/strict';
import { CRM_EVENT_TYPES, type CrmEvent } from './domain.js';
import { canChangeStage, createCrmEvent, isTerminalStage } from './crm.js';

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

test('CRM event factory creates a timestamped auditable event', () => {
  const now = new Date('2026-09-10T02:00:00.000Z');
  const created = createCrmEvent('lead-2', 'STAGE_CHANGED', { fromStage: 'CONTATADO', toStage: 'RESPONDEU' }, now);
  assert.equal(created.leadId, 'lead-2');
  assert.equal(created.type, 'STAGE_CHANGED');
  assert.equal(created.occurredAt, now.toISOString());
  assert.equal(created.fromStage, 'CONTATADO');
  assert.equal(created.toStage, 'RESPONDEU');
  assert.match(created.id, /^evt-/);
});

test('CRM prevents returning a lead to NOVO and changing from OPT-OUT', () => {
  assert.equal(canChangeStage('QUALIFICADO', 'NOVO'), false);
  assert.equal(canChangeStage('OPT-OUT', 'CONTATADO'), false);
  assert.equal(canChangeStage('CONTATADO', 'RESPONDEU'), true);
  assert.equal(canChangeStage('RESPONDEU', 'INTERESSADO'), true);
});

test('CRM identifies terminal commercial states', () => {
  assert.equal(isTerminalStage('GANHO'), true);
  assert.equal(isTerminalStage('PERDIDO'), true);
  assert.equal(isTerminalStage('OPT-OUT'), true);
  assert.equal(isTerminalStage('NEGOCIAÇÃO'), false);
});
