import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyLead } from './qualify.js';
import type { Lead } from './domain.js';

const baseLead: Lead = {
  id: '123',
  name: 'Empresa Teste',
  segment: null,
  city: 'Bauru',
  state: 'SP',
  country: 'Brasil',
  address: 'Rua X',
  phone: '5514999999999',
  whatsapp: '5514999999999',
  phoneStatus: 'MISSING',
  website: null,
  googleMapsUrl: null,
  rating: null,
  reviews: null,
  source: 'manual',
  sourceId: null,
  dataQualityScore: 0,
  dataQualityReasons: [],
  score: 0,
  scoreReasons: [],
  stage: 'NOVO',
  optOut: false,
  contactedAt: null,
  lastContactAt: null,
  personalizedMessage: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test('qualifyLead - Oportunidade com alto volume e sem automação', () => {
  const lead = qualifyLead({
    ...baseLead,
    segment: 'barbearia', // 30
    phoneStatus: 'VERIFIED', // 20
    website: 'https://exemplo.com', // 5
    reviews: 120, // 20
    automationSignal: 'NOT_DETECTED' // 15
  });
  assert.equal(lead.score, 90);
  assert.equal(lead.stage, 'QUALIFICADO');
  assert.ok(lead.scoreReasons.includes('automação não detectada combinada com alto volume'));
});

test('qualifyLead - Automação provável detectada', () => {
  const lead = qualifyLead({
    ...baseLead,
    segment: 'salao_de_beleza', // 30
    phoneStatus: 'VERIFIED', // 20
    reviews: 60, // 10
    automationSignal: 'PROBABLE' // 5
  });
  assert.equal(lead.score, 65);
  assert.equal(lead.stage, 'QUALIFICADO');
  assert.ok(lead.scoreReasons.includes('automação provável detectada'));
});

test('qualifyLead - Poucas avaliações não zera nem descarta automaticamente', () => {
  const lead = qualifyLead({
    ...baseLead,
    segment: 'barbearia', // 30
    phoneStatus: 'NEEDS_REVIEW', // 10
    reviews: 3, // 0
    automationSignal: 'NOT_DETECTED' // 5
  });
  assert.equal(lead.score, 45);
  assert.equal(lead.stage, 'NOVO');
});

test('qualifyLead - Franquia penalizada fortemente', () => {
  const lead = qualifyLead({
    ...baseLead,
    name: 'Smart Fit Centro',
    segment: 'academia', // 30
    phoneStatus: 'VERIFIED', // 20
    reviews: 500, // 20
    automationSignal: 'NOT_DETECTED' // 15
  });
  // 30 + 20 + 20 + 15 = 85. 85 - 50 = 35.
  assert.equal(lead.score, 35);
  assert.equal(lead.stage, 'NOVO');
  assert.ok(lead.scoreReasons.includes('possível rede/franquia'));
});

test('qualifyLead - Ausência de site não derruba classificação', () => {
  const leadComSite = qualifyLead({
    ...baseLead,
    segment: 'manicure_nail_designer', // 30
    phoneStatus: 'VERIFIED', // 20
    reviews: 80, // 10
    website: 'https://exemplo.com', // 5
    automationSignal: 'POSSIBLE' // 10
  }); // Score = 75

  const leadSemSite = qualifyLead({
    ...baseLead,
    segment: 'manicure_nail_designer', // 30
    phoneStatus: 'VERIFIED', // 20
    reviews: 80, // 10
    website: null, // 0
    automationSignal: 'POSSIBLE' // 10
  }); // Score = 70

  assert.equal(leadComSite.score, 75);
  assert.equal(leadComSite.stage, 'QUALIFICADO');
  
  assert.equal(leadSemSite.score, 70);
  assert.equal(leadSemSite.stage, 'QUALIFICADO');
  
  // A diferença é apenas os 5 pontos do site
  assert.equal(leadComSite.score - leadSemSite.score, 5);
});
