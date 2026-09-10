import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOutreachQueue } from './outreach.js';
import type { Lead } from './domain.js';

const base: Lead = {
  id: '1', name: 'Teste Barbearia', segment: 'barbearia', city: 'Bauru', state: 'SP', country: 'Brasil',
  address: 'Rua Teste', phone: '5514999999999', whatsapp: '5514999999999', phoneStatus: 'VERIFIED', website: 'https://example.com',
  googleMapsUrl: null, rating: 4.8, reviews: 100, source: 'apify', sourceId: 'x', score: 90,
  scoreReasons: [], stage: 'QUALIFICADO', optOut: false, contactedAt: null, lastContactAt: null,
  personalizedMessage: 'Olá! Posso te mostrar a Livia?', notes: null, createdAt: '', updatedAt: '',
};

test('queue keeps qualified lead reviewable but never auto-authorizes sending', () => {
  const [item] = buildOutreachQueue([base]);
  assert.equal(item.eligible, false);
  assert.match(item.reason, /aguardando/i);
});

test('queue blocks opt-out', () => {
  const [item] = buildOutreachQueue([{ ...base, optOut: true }]);
  assert.equal(item.eligible, false);
  assert.equal(item.reason, 'OPT-OUT registrado');
});

test('queue blocks missing phone and message', () => {
  const [noPhone] = buildOutreachQueue([{ ...base, phone: null, whatsapp: null, phoneStatus: 'MISSING' }]);
  assert.equal(noPhone.reason, 'sem telefone');
  const [noMessage] = buildOutreachQueue([{ ...base, personalizedMessage: null }]);
  assert.equal(noMessage.reason, 'mensagem ainda não personalizada');
});

test('queue blocks phone that still needs verification', () => {
  const [item] = buildOutreachQueue([{ ...base, phoneStatus: 'NEEDS_REVIEW' }]);
  assert.equal(item.eligible, false);
  assert.equal(item.reason, 'telefone encontrado, mas ainda não verificado');
});

test('queue blocks structurally rejected phone', () => {
  const [item] = buildOutreachQueue([{ ...base, phoneStatus: 'REJECTED' }]);
  assert.equal(item.eligible, false);
  assert.equal(item.reason, 'telefone rejeitado por validação estrutural');
});
