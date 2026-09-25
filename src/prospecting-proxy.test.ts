import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/prospecting.js';
import { _setEnv, createSessionCookieValue } from './auth.js';

function setupEnv() {
  _setEnv('access', 'sessionsecret456');
  process.env.LIVIA_INTERNAL_URL = 'http://livia.test';
  process.env.LIVIA_API_SECRET = 'liviasecret789';
}

function createMockReqRes(body: any = {}, hasAuth: boolean = true) {
  let statusSet = 0;
  let jsonSent: any = null;

  const req = {
    method: 'POST',
    cookies: hasAuth ? { revenuesid: createSessionCookieValue() } : {},
    body
  };

  const res = {
    status: (s: number) => { statusSet = s; return res; },
    json: (j: any) => { jsonSent = j; return res; },
    setHeader: () => {}
  };

  return { req, res, getStatus: () => statusSet, getJson: () => jsonSent };
}

test('prospecting proxy - blocks unauthenticated requests', async () => {
  setupEnv();
  const { req, res, getStatus } = createMockReqRes({ action: 'get', leadId: '123' }, false);
  await handler(req as any, res as any);
  assert.equal(getStatus(), 401);
});

test('prospecting proxy - rejects missing config', async () => {
  setupEnv();
  process.env.LIVIA_INTERNAL_URL = '';
  const { req, res, getStatus, getJson } = createMockReqRes({ action: 'get', leadId: '123' });
  await handler(req as any, res as any);
  assert.equal(getStatus(), 500);
  assert.equal(getJson().error, 'Internal configuration error');
});

test('prospecting proxy - get forwards correctly', async (t) => {
  setupEnv();
  const { req, res, getStatus, getJson } = createMockReqRes({ action: 'get', leadId: 'xyz 123' });
  
  let fetchCalledWithUrl = '';
  let fetchOptions: any = {};
  
  mock.method(globalThis, 'fetch', async (url: string, options: any) => {
    fetchCalledWithUrl = url;
    fetchOptions = options;
    return {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ session: true })
    };
  });
  
  await handler(req as any, res as any);
  assert.equal(getStatus(), 200);
  assert.deepEqual(getJson(), { session: true });
  assert.equal(fetchCalledWithUrl, 'http://livia.test/api/internal/prospecting?leadId=xyz%20123');
  assert.equal(fetchOptions.method, 'GET');
  assert.equal(fetchOptions.headers['Authorization'], 'Bearer liviasecret789');
});

test('prospecting proxy - prepare forwards POST correctly', async (t) => {
  setupEnv();
  const payload = {
    action: 'prepare',
    leadId: '1',
    phone: '2',
    businessName: '3',
    segment: '4',
    initialManualMessage: '5'
  };
  const { req, res, getStatus } = createMockReqRes(payload);
  
  let fetchOptions: any = {};
  mock.method(globalThis, 'fetch', async (url: string, options: any) => {
    fetchOptions = options;
    return {
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true })
    };
  });
  
  await handler(req as any, res as any);
  assert.equal(getStatus(), 201);
  assert.equal(fetchOptions.method, 'POST');
  
  const body = JSON.parse(fetchOptions.body);
  assert.equal(body.leadId, '1');
  assert.equal(body.initialManualMessage, '5');
  assert.equal(body.channel, undefined);
});

test('prospecting proxy - demo channel is preserved for POST, GET, and PATCH', async () => {
  setupEnv();
  const calls: Array<{ url: string, options: any }> = [];
  mock.method(globalThis, 'fetch', async (url: string, options: any) => {
    calls.push({ url, options });
    return {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    };
  });

  const prepare = createMockReqRes({ action: 'prepare', leadId: '1', phone: '2', businessName: '3', segment: '4', initialManualMessage: '5', channel: 'demo' });
  await handler(prepare.req as any, prepare.res as any);
  const get = createMockReqRes({ action: 'get', leadId: '1', channel: 'demo' });
  await handler(get.req as any, get.res as any);
  const confirm = createMockReqRes({ action: 'confirm_manual_send', normalizedPhone: '5511999', channel: 'demo' });
  await handler(confirm.req as any, confirm.res as any);

  assert.equal(JSON.parse(calls[0].options.body).channel, 'demo');
  assert.equal(calls[1].url, 'http://livia.test/api/internal/prospecting?leadId=1&channel=demo');
  assert.deepEqual(JSON.parse(calls[2].options.body), { action: 'confirm_manual_send', channel: 'demo' });
});

test('prospecting proxy - confirm_manual_send forwards PATCH correctly', async (t) => {
  setupEnv();
  const { req, res, getStatus } = createMockReqRes({ action: 'confirm_manual_send', normalizedPhone: '5511999' });
  
  let fetchCalledWithUrl = '';
  let fetchOptions: any = {};
  mock.method(globalThis, 'fetch', async (url: string, options: any) => {
    fetchCalledWithUrl = url;
    fetchOptions = options;
    return {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    };
  });
  
  await handler(req as any, res as any);
  assert.equal(getStatus(), 200);
  assert.equal(fetchCalledWithUrl, 'http://livia.test/api/internal/prospecting/5511999');
  assert.equal(fetchOptions.method, 'PATCH');
  assert.equal(JSON.parse(fetchOptions.body).action, 'confirm_manual_send');
});

test('prospecting proxy - invalid payload structure', async () => {
  setupEnv();
  
  // missing leadId for get
  let p1 = createMockReqRes({ action: 'get' });
  await handler(p1.req as any, p1.res as any);
  assert.equal(p1.getStatus(), 400);

  // missing segment for prepare
  let p2 = createMockReqRes({ action: 'prepare', leadId: '1', phone: '2', businessName: '3', initialManualMessage: '5' });
  await handler(p2.req as any, p2.res as any);
  assert.equal(p2.getStatus(), 400);

  // empty normalizedPhone for abort
  let p3 = createMockReqRes({ action: 'abort', normalizedPhone: '   ' });
  await handler(p3.req as any, p3.res as any);
  assert.equal(p3.getStatus(), 400);
  
  // unknown action
  let p4 = createMockReqRes({ action: 'destroy_database' });
  await handler(p4.req as any, p4.res as any);
  assert.equal(p4.getStatus(), 400);
});

test('prospecting proxy - handles timeout correctly', async (t) => {
  setupEnv();
  const { req, res, getStatus } = createMockReqRes({ action: 'get', leadId: '123' });
  
  mock.method(globalThis, 'fetch', async (url: string, options: any) => {
    const error = new Error('Timeout');
    error.name = 'AbortError';
    throw error;
  });
  
  await handler(req as any, res as any);
  assert.equal(getStatus(), 504);
});

test('prospecting proxy - sanitizes Livia 401 response', async (t) => {
  setupEnv();
  const { req, res, getStatus, getJson } = createMockReqRes({ action: 'get', leadId: '123' });
  
  mock.method(globalThis, 'fetch', async () => {
    return {
      status: 401,
      headers: new Headers(),
      text: async () => 'Internal unauth'
    };
  });
  
  await handler(req as any, res as any);
  assert.equal(getStatus(), 500); // the proxy should map internal 401 to generic 500 error
  assert.equal(getJson().error, 'Upstream authorization error');
});

test('prospecting proxy - preserves 404, 409 without leaking secrets', async (t) => {
  setupEnv();
  
  let p404 = createMockReqRes({ action: 'get', leadId: '123' });
  mock.method(globalThis, 'fetch', async () => ({
    status: 404,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ error: 'Not found' })
  }));
  await handler(p404.req as any, p404.res as any);
  assert.equal(p404.getStatus(), 404);
  assert.equal(p404.getJson().error, 'Not found');
  
  let p409 = createMockReqRes({ action: 'get', leadId: '123' });
  mock.method(globalThis, 'fetch', async () => ({
    status: 409,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ existing: true })
  }));
  await handler(p409.req as any, p409.res as any);
  assert.equal(p409.getStatus(), 409);
  assert.equal(p409.getJson().existing, true);
});
