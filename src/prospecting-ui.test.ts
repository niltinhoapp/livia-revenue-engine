import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('revenue-ux.js - pure client functions', async () => {
  // 1. Minimal DOM Mock
  const mockElement = {
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    getAttribute: () => 'false',
    setAttribute: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    prepend: () => {},
    after: () => {},
    addEventListener: () => {},
    style: {}
  };
  
  (globalThis as any).document = {
    getElementById: () => mockElement,
    createElement: () => mockElement,
  };
  (globalThis as any).window = { state: { leads: [], currentLeadId: null } };
  (globalThis as any).MutationObserver = class { observe() {} };

  // 2. Load the script
  const scriptContent = fs.readFileSync('revenue-ux.js', 'utf8');
  // eval the script in the mocked environment
  eval(scriptContent);

  const LiviaProspectingClient = (globalThis as any).window.LiviaProspectingClient;
  assert.ok(LiviaProspectingClient, 'LiviaProspectingClient should be exported');

  // 3. Test getStatusLabel
  const { getStatusLabel, apiProspecting, isTerminalStatus } = LiviaProspectingClient;
  assert.equal(getStatusLabel('PREPARED'), 'Demonstração preparada');
  assert.equal(getStatusLabel('HUMAN'), 'Atendimento comercial humano');
  assert.equal(getStatusLabel('UNKNOWN_STATE'), 'UNKNOWN_STATE');

  // 4. Test isTerminalStatus (polling logic)
  assert.equal(isTerminalStatus('PREPARED'), false, 'PREPARED must poll');
  assert.equal(isTerminalStatus('WAITING_REPLY'), false, 'WAITING_REPLY must poll');
  assert.equal(isTerminalStatus('LIVIA_ACTIVE'), false, 'LIVIA_ACTIVE must poll');
  assert.equal(isTerminalStatus('REVEALED'), false, 'REVEALED must poll');
  assert.equal(isTerminalStatus('INTERESTED'), false, 'INTERESTED must poll');
  
  assert.equal(isTerminalStatus('HUMAN'), true, 'HUMAN must NOT poll');
  assert.equal(isTerminalStatus('CLOSED'), true, 'CLOSED must NOT poll');
  assert.equal(isTerminalStatus('NOT_INTERESTED'), true, 'NOT_INTERESTED must NOT poll');
  assert.equal(isTerminalStatus('OPTED_OUT'), true, 'OPTED_OUT must NOT poll');
  assert.equal(isTerminalStatus('EXPIRED'), true, 'EXPIRED must NOT poll');

  // 5. Test apiProspecting (mocking fetch)
  let fetchUrl = '';
  let fetchOptions: any = {};
  (globalThis as any).fetch = async (url: string, options: any) => {
    fetchUrl = url;
    fetchOptions = options;
    return {
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ session: 'created' })
    };
  };

  const payload = { action: 'prepare', leadId: '123' };
  const result = await apiProspecting(payload);
  
  assert.equal(fetchUrl, '/api/prospecting');
  assert.equal(fetchOptions.method, 'POST');
  assert.equal(JSON.parse(fetchOptions.body).action, 'prepare');
  assert.equal(result.status, 201);
  assert.deepEqual(result.data, { session: 'created' });
});
