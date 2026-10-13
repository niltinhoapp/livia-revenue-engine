import test from 'node:test';
import assert from 'node:assert/strict';
import { assessIntent, isValidPublicUrl } from './intent-radar.js';

const url = 'https://example.org/post/123';

test('dono procurando atendimento é alta prioridade', () => {
  const result = assessIntent({
    sourceUrl: url,
    text: 'Tenho um salão de beleza e preciso automatizar o atendimento no WhatsApp. Alguém indica sistema?'
  });
  assert.equal(result.level, 'HIGH');
  assert.equal(result.decision, 'REVIEW');
  assert.equal(result.intentType, 'COMMERCIAL');
  assert.equal(result.segment, 'salao_de_beleza');
  assert.ok(result.score >= 75);
  assert.ok(result.suggestedApproach.includes('Lívia'));
});

test('barbeiro com dor de perda de clientes tem urgência alta e qualificação alta', () => {
  const result = assessIntent({
    sourceUrl: 'https://reddit.com/r/empreendedorismo/comments/abc123',
    text: 'Sou barbeiro e dono da minha barbearia. Estou perdendo clientes porque não dou conta de responder as mensagens no WhatsApp enquanto corto cabelo. Preciso de um sistema de agendamento urgente.'
  });
  assert.equal(result.level, 'HIGH');
  assert.equal(result.urgency, 'HIGH');
  assert.equal(result.segment, 'barbearia');
  assert.ok(result.evidence.some(e => e.includes('Segmento prioritário')));
  assert.ok(result.problemDescription.includes('Perda de clientes'));
});

test('manicure com esmalteria buscando recepcionista virtual é qualificada', () => {
  const result = assessIntent({
    sourceUrl: 'https://comunidade-beleza.com.br/duvidas/456',
    text: 'Tenho uma esmalteria e sou manicure. Procuro uma recepcionista virtual ou robô de atendimento para marcar horários no WhatsApp.'
  });
  assert.equal(result.level, 'HIGH');
  assert.equal(result.segment, 'manicure_nail_designer');
});

test('empresa sem intenção comercial não vira oportunidade', () => {
  const result = assessIntent({
    sourceUrl: url,
    text: 'Tenho uma barbearia no centro. Venham conhecer nosso trabalho e tomar um café.'
  });
  assert.notEqual(result.level, 'HIGH');
  assert.equal(result.decision, 'DISCARD');
});

test('fornecedor vendendo automação é bloqueado', () => {
  const result = assessIntent({
    sourceUrl: url,
    text: 'Vendo robôs de atendimento pelo WhatsApp. Quem precisa contratar um sistema? Entre em contato.'
  });
  assert.equal(result.level, 'NONE');
  assert.equal(result.decision, 'DISCARD');
  assert.ok(result.blockers.some(b => b.includes('fornecedor')));
});

test('estudante e projeto de faculdade é bloqueado', () => {
  const result = assessIntent({
    sourceUrl: url,
    text: 'Sou estudante e estou fazendo um projeto de faculdade de sistema de agendamento para barbearia no WhatsApp.'
  });
  assert.equal(result.level, 'NONE');
  assert.equal(result.decision, 'DISCARD');
});

test('reclamação de consumidor/cliente não vira oportunidade', () => {
  const result = assessIntent({
    sourceUrl: url,
    text: 'Fui cliente dessa barbearia e o atendimento pelo WhatsApp foi péssimo, demoraram horas para responder.'
  });
  assert.equal(result.level, 'NONE');
  assert.equal(result.decision, 'DISCARD');
});

test('fonte ausente bloqueia oportunidade', () => {
  const result = assessIntent({
    sourceUrl: '',
    text: 'Tenho um salão e preciso automatizar atendimento no WhatsApp. Alguém indica?'
  });
  assert.equal(result.level, 'NONE');
  assert.ok(result.blockers.some(b => b.includes('Fonte não verificável')));
});

test('endereço interno/localhost é bloqueado por segurança (SSRF)', () => {
  assert.equal(isValidPublicUrl('http://localhost:3000/post'), false);
  assert.equal(isValidPublicUrl('http://127.0.0.1/test'), false);
  assert.equal(isValidPublicUrl('http://192.168.1.1/admin'), false);
  assert.equal(isValidPublicUrl('http://10.0.0.5/api'), false);
  assert.equal(isValidPublicUrl('https://meusalao.com.br/duvida'), true);

  const result = assessIntent({
    sourceUrl: 'http://127.0.0.1:8080/forum/123',
    text: 'Tenho uma barbearia e preciso de um sistema de agendamento no WhatsApp.'
  });
  assert.equal(result.level, 'NONE');
  assert.ok(result.blockers.some(b => b.includes('Fonte não verificável')));
});

test('curiosidade sem vínculo de negócio fica como LOW/WATCH', () => {
  const result = assessIntent({
    sourceUrl: url,
    text: 'Qual sistema de agendamento pelo WhatsApp vocês recomendam hoje em dia?'
  });
  assert.equal(result.level, 'LOW');
  assert.equal(result.decision, 'WATCH');
  assert.equal(result.intentType, 'CURIOSITY');
});
