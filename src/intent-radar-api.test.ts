import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/intent-radar.js';
import { _setEnv, createSessionCookieValue } from './auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockRes() {
  let statusCode = 200;
  let responseData: any = null;
  const headers: Record<string, string> = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res;
    },
    _getStatus() {
      return statusCode;
    },
    _getData() {
      return responseData;
    },
  } as unknown as VercelResponse & { _getStatus(): number; _getData(): any };

  return res;
}

test('api/intent-radar - rejeita requisição não autenticada com 401', async () => {
  _setEnv('access123', 'sessionsecret456');

  const req = {
    method: 'GET',
    headers: {},
    cookies: {},
    query: {},
  } as unknown as VercelRequest;

  const res = createMockRes();
  await handler(req, res);

  assert.equal(res._getStatus(), 401);
  assert.equal(res._getData().ok, false);
});

test('api/intent-radar - avalia sinais manuais com sucesso via POST', async () => {
  _setEnv('access123', 'sessionsecret456');
  const sessionCookie = createSessionCookieValue();

  const req = {
    method: 'POST',
    headers: {},
    cookies: { revenuesid: sessionCookie },
    body: {
      signals: [
        {
          sourceUrl: 'https://reddit.com/r/barbearia/1',
          text: 'Sou dono de uma barbearia e preciso de um sistema de agendamento no WhatsApp urgente.',
        },
      ],
    },
  } as unknown as VercelRequest;

  const res = createMockRes();
  await handler(req, res);

  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.equal(data.ok, true);
  assert.equal(data.analyzed, 1);
  assert.equal(data.results[0].level, 'HIGH');
  assert.equal(data.results[0].segment, 'barbearia');
});

test('api/intent-radar - rejeita lista de sinais vazia ou inválida', async () => {
  _setEnv('access123', 'sessionsecret456');
  const sessionCookie = createSessionCookieValue();

  const req = {
    method: 'POST',
    headers: {},
    cookies: { revenuesid: sessionCookie },
    body: {
      signals: [],
    },
  } as unknown as VercelRequest;

  const res = createMockRes();
  await handler(req, res);

  assert.equal(res._getStatus(), 400);
});

test('api/intent-radar - retorna presets via POST action: presets', async () => {
  _setEnv('access123', 'sessionsecret456');
  const sessionCookie = createSessionCookieValue();

  const req = {
    method: 'POST',
    headers: {},
    cookies: { revenuesid: sessionCookie },
    body: { action: 'presets' },
  } as unknown as VercelRequest;

  const res = createMockRes();
  await handler(req, res);

  assert.equal(res._getStatus(), 200);
  assert.equal(res._getData().ok, true);
  assert.ok(Array.isArray(res._getData().presets));
});
