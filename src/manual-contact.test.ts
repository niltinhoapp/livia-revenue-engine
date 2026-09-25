import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

type El = Record<string, any>;

function makeEl(id = ''): El {
  const el: El = {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    className: '',
    readOnly: false,
    style: {},
    dataset: {},
    _listeners: {} as Record<string, Function>,
    classList: {
      _s: new Set<string>(),
      add(c: string) { this._s.add(c); },
      remove(c: string) { this._s.delete(c); },
      contains(c: string) { return this._s.has(c); },
      toggle(c: string, force?: boolean) {
        if (force === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
        else if (force) this._s.add(c); else this._s.delete(c);
      }
    },
    addEventListener(evt: string, fn: Function) { el._listeners[evt] = fn; },
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    after: () => {},
    prepend: () => {},
    closest: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    focus: () => {},
    reset: () => {},
  };
  return el;
}

function bootApp() {
  const els: Record<string, El> = {};
  const ids = [
    'search-form', 'search-button', 'loading', 'error', 'summary', 'results', 'lead-table', 'empty',
    'search-segment', 'selected-segment-label', 'segment-filter', 'score-filter', 'drawer', 'drawer-content',
    'drawer-close', 'drawer-backdrop', 'metric-found', 'metric-qualified', 'metric-phone', 'metric-rate',
    'results-subtitle',
    'manual-contact-open', 'manual-contact-modal', 'manual-contact-form', 'manual-name', 'manual-phone',
    'manual-segment', 'manual-type', 'manual-error', 'manual-submit', 'manual-contact-close',
    'manual-contact-backdrop', 'manual-cancel',
  ];
  ids.forEach((id) => { els[id] = makeEl(id); });

  els['summary'].classList.add('hidden');
  els['results'].classList.add('hidden');
  els['manual-contact-modal'].classList.add('hidden');
  els['search-segment'].value = 'barbearia';
  els['segment-filter'].value = 'all';
  els['score-filter'].value = '0';
  els['manual-segment'].value = 'barbearia';
  els['manual-type'].value = 'revenue';

  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
  };

  (globalThis as any).document = {
    getElementById: (id: string) => els[id] ?? null,
    createElement: () => makeEl(),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  (globalThis as any).window = {};

  const appSrc = fs.readFileSync('app.js', 'utf8');
  const manualSrc = fs.readFileSync('manual-contact.js', 'utf8');
  const exportLine = 'globalThis.__app = { state, renderTable, updateSummary, openLead, findLeadByPhone, isDemoLead, isManualLead, persistManualLeads, readManualLeads, normalizedPhone, leadRowHtml };';

  // Both scripts share one scope, exactly as two classic <script> tags do:
  // manual-contact.js resolves `state` and app.js's functions lexically.
  // The wrapper keeps each boot isolated so tests don't leak into each other.
  (0, eval)(`(function(){\n${appSrc}\n${manualSrc}\n${exportLine}\n})();`);

  return { els, app: (globalThis as any).__app, store };
}

function submitManual(els: Record<string, El>, { name, phone, segment, type }: any) {
  els['manual-name'].value = name;
  els['manual-phone'].value = phone;
  els['manual-segment'].value = segment ?? 'barbearia';
  els['manual-type'].value = type ?? 'revenue';
  const handler = els['manual-contact-form']._listeners['submit'];
  assert.ok(handler, 'manual contact form must have a submit handler');
  handler({ preventDefault: () => {} });
}

test('manual contact - Prospecção creates a real Revenue lead without Google Maps', () => {
  const { els, app } = bootApp();

  assert.equal(app.state.leads.length, 0, 'starts with no leads (no Google Maps search ran)');

  submitManual(els, { name: 'Barbearia do Zé', phone: '+55 14 99999-8888', segment: 'barbearia' });

  assert.equal(app.state.leads.length, 1, 'manual lead was created');
  const lead = app.state.leads[0];

  // 1 + 3: created without Google Maps, origin identifiable
  assert.equal(lead.source, 'manual', 'origin must be identifiable as manual');
  assert.equal(lead.googleMapsUrl, '', 'manual lead has no Google Maps origin');
  assert.equal(lead.name, 'Barbearia do Zé');
  assert.equal(lead.phone, '5514999998888', 'phone normalized with DDI');
  assert.equal(lead.segment, 'barbearia');

  // 2: enters the SAME Revenue flow — same lead shape, same stage machine
  assert.equal(lead.stage, 'NOVO', 'enters the existing funnel at NOVO');
  assert.equal(lead.isDemo, undefined, 'Prospecção is not a demo');
  assert.equal(lead.channel, undefined, 'Prospecção keeps the default Revenue channel');
  assert.ok(app.state.filtered.includes(lead), 'appears in the Revenue funnel (state.filtered)');
  assert.ok(app.leadRowHtml(lead).includes('Cadastro manual'), 'row shows the manual origin');
});

test('manual contact - Demo is isolated from the Revenue funnel and metrics', () => {
  const { els, app } = bootApp();

  submitManual(els, { name: 'Lead Revenue', phone: '+55 14 90000-0001', type: 'revenue' });
  submitManual(els, { name: 'Teste Demo', phone: '+55 14 90000-0002', type: 'demo' });

  assert.equal(app.state.leads.length, 2);
  const demo = app.state.leads.find((l: any) => l.name === 'Teste Demo');
  const revenue = app.state.leads.find((l: any) => l.name === 'Lead Revenue');

  // 5 + 6: demo contact entered manually, carries channel demo
  assert.equal(demo.isDemo, true, 'demo lead is flagged');
  assert.equal(demo.channel, 'demo', 'demo lead carries channel: demo');
  assert.equal(demo.source, 'manual');

  // 7: demo must NOT contaminate the Revenue funnel or metrics
  assert.ok(!app.state.filtered.includes(demo), 'demo is excluded from the Revenue funnel');
  assert.ok(app.state.filtered.includes(revenue), 'revenue lead stays in the funnel');
  assert.equal(app.state.filtered.length, 1, 'only the Revenue lead counts');
  assert.equal(String(els['metric-phone'].textContent), '1', 'demo is excluded from phone metric');
  assert.equal(String(els['metric-found'].textContent), '1', 'demo is excluded from found metric');
  assert.equal(Number(demo.score), 0, 'demo never reaches the score>=60 opportunity metric');
});

test('manual contact - existing phone dedup rule is reused', () => {
  const { els, app } = bootApp();

  submitManual(els, { name: 'Primeiro', phone: '+55 14 91111-2222' });
  assert.equal(app.state.leads.length, 1);

  // 9: same phone, different formatting — must be blocked, not silently duplicated
  submitManual(els, { name: 'Duplicado', phone: '5514911112222' });
  assert.equal(app.state.leads.length, 1, 'duplicate phone must not create a second commercial lead');
  assert.ok(!els['manual-error'].classList.contains('hidden'), 'user is told about the duplicate');
  assert.ok(els['manual-error'].innerHTML.includes('Primeiro'), 'error names the existing lead');
  assert.ok(els['manual-error'].innerHTML.includes('Abrir lead existente'), 'offers to open the existing lead');

  // findLeadByPhone is the shared rule and ignores demo contacts
  assert.ok(app.findLeadByPhone('+55 14 91111-2222'), 'dedup matches across formats');
  assert.equal(app.findLeadByPhone('+55 14 95555-4444'), null, 'unknown phone is free');
});

test('manual contact - Google Maps leads keep working alongside manual ones', () => {
  const { els, app } = bootApp();

  // Simulate the result of an existing Google Maps search (untouched code path)
  app.state.leads.push({ id: 'gmaps-1', name: 'Salão Maps', segment: 'salao_de_beleza', score: 82, phone: '5514988887777', stage: 'QUALIFICADO', city: 'Bauru', state: 'SP', googleMapsUrl: 'https://maps.google.com/x' });
  app.renderTable();

  assert.equal(app.state.filtered.length, 1, 'Google Maps lead is in the funnel');
  assert.equal(app.isManualLead(app.state.leads[0]), false, 'Google Maps lead is not manual');
  assert.ok(!app.leadRowHtml(app.state.leads[0]).includes('Cadastro manual'), 'no manual badge on Maps leads');

  // 4: adding a manual contact does not disturb the Google Maps lead
  submitManual(els, { name: 'Manual Novo', phone: '+55 14 93333-4444' });
  app.renderTable();

  assert.equal(app.state.filtered.length, 2, 'both origins converge into the same funnel');
  assert.ok(app.state.filtered.some((l: any) => l.id === 'gmaps-1'), 'Google Maps lead preserved');
  assert.ok(app.state.filtered.some((l: any) => l.source === 'manual'), 'manual lead joined the same funnel');
});

test('manual contact - invalid phone is rejected and nothing is created', () => {
  const { els, app } = bootApp();

  submitManual(els, { name: 'Sem telefone', phone: '123' });
  assert.equal(app.state.leads.length, 0, 'invalid phone creates no lead');
  assert.ok(!els['manual-error'].classList.contains('hidden'), 'shows validation error');

  submitManual(els, { name: '', phone: '+55 14 99999-0000' });
  assert.equal(app.state.leads.length, 0, 'missing name creates no lead');
});

test('manual contact - manual leads survive a Google Maps search and a reload', () => {
  const { els, app, store } = bootApp();

  submitManual(els, { name: 'Persistente', phone: '+55 14 97777-6666' });
  submitManual(els, { name: 'Demo Persistente', phone: '+55 14 97777-5555', type: 'demo' });

  // Persisted for reload
  const persisted = JSON.parse(store.get('liviaRevenueManualLeads')!);
  assert.equal(persisted.length, 2, 'both manual contacts persisted');
  assert.ok(persisted.some((l: any) => l.channel === 'demo'), 'demo channel persisted across reload');

  // A new Google Maps search replaces state.leads — manual leads must survive
  const manualBefore = app.state.leads.filter(app.isManualLead);
  app.state.leads = [{ id: 'gmaps-9', name: 'Novo Maps', segment: 'barbearia', score: 70, phone: '5514911110000', stage: 'NOVO' }, ...manualBefore];
  app.renderTable();

  assert.ok(app.state.leads.some((l: any) => l.name === 'Persistente'), 'manual Revenue lead survived the new search');
  assert.ok(app.state.leads.some((l: any) => l.name === 'Demo Persistente'), 'manual demo lead survived the new search');
  assert.ok(!app.state.filtered.some((l: any) => l.name === 'Demo Persistente'), 'demo still out of the funnel after a search');
});

test('revenue-ux.js - resolves demo channel from the lead itself', () => {
  const uxContent = fs.readFileSync('revenue-ux.js', 'utf8');
  // 6 + 8: the demo channel must be derivable from the lead so GET/PATCH keep it
  assert.ok(uxContent.includes("lead?.channel === 'demo' ? 'demo' : 'revenue'"),
    'getProspectingChannel must fall back to the lead channel');
  assert.ok(uxContent.includes("if (lead.channel === 'demo') channelSelect.disabled = true"),
    'a demo contact must not be switchable back to the Revenue funnel');
});
