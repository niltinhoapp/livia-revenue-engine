import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, funnelSummary, transitionLead } from './funnel.js';
import type { Lead } from './domain.js';

const lead: Lead = {
  id: '1', name: 'Teste', segment: 'barbearia', city: 'Bauru', state: 'SP', country: 'Brasil', address: '',
  phone: '5514999999999', whatsapp: '5514999999999', website: null, googleMapsUrl: null, rating: null,
  reviews: null, source: 'manual', sourceId: null, dataQualityScore: 0, dataQualityReasons: [], score: 80, scoreReasons: [], stage: 'QUALIFICADO',
  optOut: false, contactedAt: null, lastContactAt: null, personalizedMessage: 'Olá', notes: null,
  phoneStatus: 'VERIFIED', createdAt: '', updatedAt: '',
};

test('allows normal commercial progression', () => {
  assert.equal(canTransition('QUALIFICADO', 'CONTATADO'), true);
  assert.equal(canTransition('CONTATADO', 'RESPONDEU'), true);
  assert.equal(canTransition('RESPONDEU', 'INTERESSADO'), true);
  assert.equal(canTransition('INTERESSADO', 'DEMONSTRAÇÃO'), true);
});

test('blocks invalid jump', () => {
  assert.equal(canTransition('QUALIFICADO', 'GANHO'), false);
  assert.throws(() => transitionLead(lead, 'GANHO'), /Transição inválida/);
});

test('records first contact time', () => {
  const updated = transitionLead(lead, 'CONTATADO');
  assert.equal(updated.stage, 'CONTATADO');
  assert.ok(updated.contactedAt);
  assert.ok(updated.lastContactAt);
});

test('summarizes funnel', () => {
  const summary = funnelSummary([lead, { ...lead, id: '2', stage: 'CONTATADO' }]);
  assert.equal(summary.QUALIFICADO, 1);
  assert.equal(summary.CONTATADO, 1);
});
