import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePlace, validateBusinessPhone } from './normalize.js';

test('ignora Instagram quando o Actor entrega perfil social no campo website', () => {
  const lead = normalizePlace({
    title: 'A Barbearia', website: 'https://instagram.com/chacara_chokito?igshid=YmMyMTA2M2Y=',
    url: 'https://www.google.com/maps/search/?api=1&query=A%20Barbearia', address: 'Rua Teste, 123',
    phone: '+55 14 98888-7777', categoryName: 'Barbearia',
  });
  assert.ok(lead);
  assert.equal(lead.website, null);
  assert.equal(lead.googleMapsUrl, 'https://www.google.com/maps/search/?api=1&query=A%20Barbearia');
  assert.equal(lead.phoneStatus, 'NEEDS_REVIEW');
  assert.equal(lead.dataQualityScore, 75);
});

test('mantém site oficial quando o campo website é um domínio real', () => {
  const lead = normalizePlace({
    title: 'Studio E Nails', website: 'https://www.studioenails.com/', address: 'Rua Teste, 123',
    phone: '+55 14 99999-9999', categoryName: 'Nail salon',
  });
  assert.ok(lead);
  assert.equal(lead.website, 'https://www.studioenails.com/');
});

test('não usa contactPhone como telefone da empresa', () => {
  const lead = normalizePlace({
    title: 'Augusto Cabeleireiro', address: 'Rua Teste, 456', categoryName: 'Cabeleireiro',
    contactPhone: '+55 14 98888-7777',
  });
  assert.ok(lead);
  assert.equal(lead.phone, null);
  assert.equal(lead.whatsapp, null);
  assert.equal(lead.phoneStatus, 'MISSING');
});

test('aceita telefone oficial estruturalmente válido, mas deixa para revisão', () => {
  const lead = normalizePlace({
    title: 'Augusto Cabeleireiro', address: 'Rua Teste, 456', categoryName: 'Cabeleireiro',
    phoneUnformatted: '+5514999998888',
  });
  assert.ok(lead);
  assert.equal(lead.phone, '5514999998888');
  assert.equal(lead.whatsapp, '5514999998888');
  assert.equal(lead.phoneStatus, 'NEEDS_REVIEW');
});

test('rejeita telefone brasileiro com estrutura inválida', () => {
  assert.equal(validateBusinessPhone('5514111111111'), 'REJECTED');
  assert.equal(validateBusinessPhone('5500999999999'), 'REJECTED');
  assert.equal(validateBusinessPhone('551499998888'), 'REJECTED');
});

test('não confunde validação estrutural com confirmação de propriedade', () => {
  assert.equal(validateBusinessPhone('5514999998888'), 'NEEDS_REVIEW');
});
