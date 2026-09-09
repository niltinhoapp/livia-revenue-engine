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
