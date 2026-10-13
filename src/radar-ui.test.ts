import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('radar-ui.js - carrega e exporta RadarUi no window', async () => {
  const mockElement = {
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    getAttribute: () => 'false',
    setAttribute: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    addEventListener: () => {},
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
  };

  (globalThis as any).document = {
    getElementById: () => mockElement,
    createElement: () => mockElement,
    addEventListener: () => {},
    readyState: 'complete',
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: () => '[]',
    setItem: () => {},
  };

  const code = fs.readFileSync('radar-ui.js', 'utf8');
  eval(code);

  const RadarUi = (globalThis as any).window.RadarUi;
  assert.ok(RadarUi, 'RadarUi deve ser exportado no window');
  assert.ok(Array.isArray(RadarUi.state.opportunities));
  assert.equal(typeof RadarUi.filterAndSort, 'function');
  assert.equal(typeof RadarUi.handleScanSubmit, 'function');
});
