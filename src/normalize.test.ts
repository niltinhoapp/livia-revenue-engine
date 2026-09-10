import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePlace } from './normalize.js';

test('ignora Instagram quando o Actor entrega perfil social no campo website', () => {
  const lead = normalizePlace({
    title: 'A Barbearia',
    website: 'https://instagram.com/chacara_chokito?igshid=YmMyMTA2M2Y=',
    url: 'https://www.google.com/maps/search/?api=1&query=A%20Barbearia',
    address: 'Rua Teste, 123',
    phone: '+55 14 99999-9999',
    categoryName: 'Barbearia',
  });

  assert.ok(lead);
  assert.equal(lead.website, null);
  assert.equal(lead.googleMapsUrl, 'https://www.google.com/maps/search/?api=1&query=A%20Barbearia');
});

test('mantém site oficial quando o campo website é um domínio real', () => {
  const lead = normalizePlace({
    title: 'Studio E Nails',
    website: 'https://www.studioenails.com/',
    address: 'Rua Teste, 123',
    phone: '+55 14 99999-9999',
    categoryName: 'Nail salon',
  });

  assert.ok(lead);
  assert.equal(lead.website, 'https://www.studioenails.com/');
});

test('não usa contactPhone como telefone da empresa', () => {
  const lead = normalizePlace({
    title: 'Augusto Cabeleireiro',
    address: 'Rua Teste, 456',
    categoryName: 'Cabeleireiro',
    contactPhone: '+55 14 98888-7777',
  });

  assert.ok(lead);
  assert.equal(lead.phone, null);
  assert.equal(lead.whatsapp, null);
});

test('aceita phoneUnformatted como telefone da própria empresa', () => {
  const lead = normalizePlace({
    title: 'Augusto Cabeleireiro',
    address: 'Rua Teste, 456',
    categoryName: 'Cabeleireiro',
    phoneUnformatted: '+5514999998888',
  });

  assert.ok(lead);
  assert.equal(lead.phone, '5514999998888');
  assert.equal(lead.whatsapp, '5514999998888');
});
