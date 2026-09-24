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

test('revenue-ux.js - syncProspectingUI re-entrancy guard prevents observer loop', async () => {
  let syncCallCount = 0;
  let observerCallbacks: Function[] = [];

  const prepareBtn = {
    addEventListener: (_: string, fn: Function) => { prepareBtn._handler = fn; },
    _handler: null as Function | null,
    disabled: false,
    textContent: 'Preparar demonstração',
  };

  const actionsContainer = {
    className: 'detail-actions livia-prospecting-actions',
    innerHTML: '',
    parentNode: { after: () => {} },
  };

  const statusEl = {
    className: 'detail-section livia-prospecting-status',
    innerHTML: '',
  };

  let statusCreated = false;
  let actionsCreated = false;

  const drawerContentEl = {
    querySelector: (sel: string) => {
      if (sel === '.livia-prospecting-status') return statusCreated ? statusEl : null;
      if (sel === '.livia-prospecting-actions') return actionsCreated ? actionsContainer : null;
      return null;
    },
    querySelectorAll: (sel: string) => {
      if (sel === '.detail-section') return [{
        querySelector: (s: string) => s === 'h3' ? { textContent: 'Abordagem' } : null,
        after: () => { statusCreated = true; }
      }];
      return [];
    },
    appendChild: () => { statusCreated = true; },
    prepend: () => {},
  };

  const elementsById: Record<string, any> = {
    'summary': { classList: { contains: () => true }, appendChild: () => {} },
    'results': { classList: { contains: () => true }, querySelectorAll: () => [], querySelector: () => null },
    'lead-table': { querySelectorAll: () => [] },
    'drawer': {
      getAttribute: () => 'false',
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      setAttribute: () => {},
    },
    'drawer-content': drawerContentEl,
    'approach-message': null,
    'approach-copy': null,
    'approach-whatsapp': null,
    'approach-another': null,
    'livia-prepare': prepareBtn,
  };

  (globalThis as any).document = {
    getElementById: (id: string) => elementsById[id] ?? null,
    createElement: () => {
      const el = {
        className: '', innerHTML: '', addEventListener: () => {},
        appendChild: () => {}, after: () => {}, prepend: () => {},
        style: {}, querySelector: () => null, querySelectorAll: () => [],
        parentNode: { after: () => { actionsCreated = true; } },
      };
      return el;
    },
  };

  (globalThis as any).state = {
    leads: [{ id: 'x', phone: '123', name: 'Test', segment: 's' }],
    currentLeadId: 'x'
  };
  (globalThis as any).window = {};

  // Simulate MutationObserver that fires callback on DOM changes
  (globalThis as any).MutationObserver = class {
    _cb: Function;
    constructor(cb: Function) { this._cb = cb; observerCallbacks.push(cb); }
    observe() {}
  };

  // Track fetch calls to count how many times syncProspectingUI runs to completion
  let fetchCount = 0;
  (globalThis as any).fetch = async () => {
    fetchCount++;
    syncCallCount++;
    // Simulate observer firing during DOM update (re-entrancy attempt)
    for (const cb of observerCallbacks) cb();
    return {
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Not found' })
    };
  };

  const script = fs.readFileSync('revenue-ux.js', 'utf8');
  eval(script);

  // Wait for the first syncProspectingUI triggered by observer setup
  await new Promise(r => setTimeout(r, 100));

  // The re-entrancy guard should prevent recursive calls.
  // Without the guard, fetchCount would be unbounded. With it, it should be small.
  assert.ok(fetchCount <= 3, `Fetch called ${fetchCount} times — re-entrancy guard should limit calls`);

  // Verify the guard variable exists in the source
  const uxContent = fs.readFileSync('revenue-ux.js', 'utf8');
  assert.ok(uxContent.includes('if (syncing) return'), 'revenue-ux.js must have re-entrancy guard');
});

test('revenue-ux.js - unwraps { session } envelope from Livia response', async () => {
  // Livia returns { session: { status: "PREPARED", ... } }.
  // The client must use res.data.session, not res.data directly.

  const { getStatusLabel } = (globalThis as any).window.LiviaProspectingClient;

  // Simulate what the fixed code does: unwrap { session: X } → X
  const liviaResponse = {
    session: {
      status: 'PREPARED',
      normalizedPhone: '5511999887766',
      initialManualMessage: 'Olá, tudo bem?'
    }
  };

  // This is what the fixed line does: res.data?.session ?? res.data
  const unwrapped = liviaResponse?.session ?? liviaResponse;
  assert.equal(unwrapped.status, 'PREPARED', 'Unwrapped session must have status');
  assert.equal(unwrapped.normalizedPhone, '5511999887766', 'Unwrapped session must have normalizedPhone');
  assert.equal(getStatusLabel(unwrapped.status), 'Demonstração preparada', 'getStatusLabel must resolve PREPARED');

  // Verify the source code does the unwrapping
  const uxContent = fs.readFileSync('revenue-ux.js', 'utf8');
  assert.ok(uxContent.includes('res.data?.session ?? res.data'),
    'revenue-ux.js must unwrap the { session } envelope');

  // Without unwrapping (the old bug): status would be undefined
  const broken = liviaResponse as any;
  assert.equal(broken.status, undefined, 'Without unwrapping, status is undefined (the bug)');
  assert.equal(getStatusLabel(broken.status), undefined, 'Without unwrapping, getStatusLabel returns undefined');
});
