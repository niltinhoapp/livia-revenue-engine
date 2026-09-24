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
  // state is a global lexical variable from app.js, NOT window.state
  (globalThis as any).state = { leads: [], currentLeadId: null };
  (globalThis as any).window = {};
  (globalThis as any).MutationObserver = class { observe() {} };

  // 2. Load the script
  const scriptContent = fs.readFileSync('revenue-ux.js', 'utf8');
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

test('revenue-ux.js - syncProspectingUI renders for valid lead via global state', async () => {
  // Reproduce real browser environment: app.js declares `const state` at
  // top-level script scope (a global lexical binding, NOT window.state).
  // revenue-ux.js must access it as `state`, not `window.state`.

  const createdElements: any[] = [];
  let statusSectionHtml = '';
  let actionsHtml = '';

  const statusSection = {
    className: '',
    innerHTML: '',
    get _html() { return this.innerHTML; },
    set _html(v: string) { this.innerHTML = v; statusSectionHtml = v; }
  };
  Object.defineProperty(statusSection, 'innerHTML', {
    get() { return statusSectionHtml; },
    set(v: string) { statusSectionHtml = v; },
    configurable: true
  });

  const actionsDiv = {
    className: '',
    innerHTML: '',
  };
  Object.defineProperty(actionsDiv, 'innerHTML', {
    get() { return actionsHtml; },
    set(v: string) { actionsHtml = v; },
    configurable: true
  });

  const drawerContentEl = {
    querySelector: (sel: string) => {
      if (sel === '.livia-prospecting-status') return null;
      if (sel === '.livia-prospecting-actions') return null;
      return null;
    },
    querySelectorAll: (sel: string) => {
      if (sel === '.detail-section') return [{
        querySelector: (s: string) => s === 'h3' ? { textContent: 'Abordagem' } : null,
        after: (el: any) => {}
      }];
      return [];
    },
    appendChild: (el: any) => {},
    prepend: () => {},
  };

  const drawerEl = {
    getAttribute: (attr: string) => attr === 'aria-hidden' ? 'false' : null,
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    setAttribute: () => {},
  };

  const elementsById: Record<string, any> = {
    'summary': { classList: { contains: () => true }, appendChild: () => {} },
    'results': { classList: { contains: () => true }, querySelectorAll: () => [], querySelector: () => null },
    'lead-table': { querySelectorAll: () => [] },
    'drawer': drawerEl,
    'drawer-content': drawerContentEl,
    'approach-message': null,
    'approach-copy': null,
    'approach-whatsapp': null,
    'approach-another': null,
    'livia-prepare': { addEventListener: () => {}, disabled: false, textContent: '' },
  };

  (globalThis as any).document = {
    getElementById: (id: string) => elementsById[id] ?? null,
    createElement: (tag: string) => {
      const el = {
        className: '',
        innerHTML: '',
        addEventListener: () => {},
        appendChild: () => {},
        after: () => {},
        prepend: () => {},
        style: {},
        querySelector: () => null,
        querySelectorAll: () => [],
        parentNode: { after: () => {} },
      };
      createdElements.push(el);
      return el;
    },
  };

  // Real environment: state is a global lexical variable, NOT window.state
  (globalThis as any).state = {
    leads: [{ id: 'lead-42', phone: '5514999999999', name: 'Barbearia Santo 7', segment: 'barbearia' }],
    currentLeadId: 'lead-42'
  };
  (globalThis as any).window = {};
  (globalThis as any).MutationObserver = class { observe() {} };

  // Mock fetch: GET prospecting returns 404 (no session yet)
  (globalThis as any).fetch = async (url: string, opts: any) => {
    return {
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Not found' })
    };
  };

  const scriptContent = fs.readFileSync('revenue-ux.js', 'utf8');
  eval(scriptContent);

  // Verify window.state was NOT set by the script (proving it uses global lexical state)
  assert.equal((globalThis as any).window.state, undefined, 'window.state must remain undefined — script must use lexical state');

  // Verify state is still the global lexical var
  assert.equal((globalThis as any).state.currentLeadId, 'lead-42', 'Global lexical state should have the lead');

  // Verify app.js keeps const state (not window.state)
  const appContent = fs.readFileSync('app.js', 'utf8');
  assert.ok(appContent.startsWith('const state = '), 'app.js must declare const state (not window.state)');

  // Verify revenue-ux.js does NOT reference window.state
  const uxContent = fs.readFileSync('revenue-ux.js', 'utf8');
  assert.ok(!uxContent.includes('window.state'), 'revenue-ux.js must not reference window.state');
});
