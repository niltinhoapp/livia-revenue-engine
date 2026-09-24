import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQueries, DEFAULT_QUERIES, SEGMENT_QUERIES } from './queries.js';

test('buildQueries - sem segmento informado retorna DEFAULT_QUERIES', () => {
  const queries = buildQueries('Bauru');
  assert.deepEqual(queries, DEFAULT_QUERIES);
  
  // Confirma que a nova regra abrange os 7 segmentos prioritários definidos
  assert.ok(queries.includes('barbearia'));
  assert.ok(queries.includes('salão de beleza'));
  assert.ok(queries.includes('manicure'));
  assert.ok(queries.includes('clínica de estética'));
  assert.ok(queries.includes('clínica odontológica'));
  assert.ok(queries.includes('pet shop'));
  assert.ok(queries.includes('tatuagem'));
});

test('buildQueries - com um único segmento', () => {
  const queries = buildQueries('Bauru', ['clinica_estetica']);
  assert.deepEqual(queries, SEGMENT_QUERIES['clinica_estetica']);
  assert.ok(queries.includes('clínica de estética'));
});

test('buildQueries - com múltiplos segmentos combinados', () => {
  const queries = buildQueries('Bauru', ['pet_shop', 'veterinaria']);
  const expected = [...SEGMENT_QUERIES['pet_shop'], ...SEGMENT_QUERIES['veterinaria']];
  
  assert.deepEqual(queries, expected);
  assert.ok(queries.includes('pet shop'));
  assert.ok(queries.includes('veterinário'));
});
