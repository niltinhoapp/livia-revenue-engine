import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('auth-ui.js - login flow integration', async () => {
  // Minimal DOM mock
  const elements: Record<string, any> = {};
  function makeEl(id: string, extra: Record<string, any> = {}) {
    const el: any = {
      id,
      classList: {
        _set: new Set(),
        add(c: string) { this._set.add(c); },
        remove(c: string) { this._set.delete(c); },
        contains(c: string) { return this._set.has(c); }
      },
      style: {},
      value: '',
      disabled: false,
      textContent: '',
      focus: () => {},
      addEventListener: (evt: string, fn: Function) => {
        el._listeners = el._listeners || {};
        el._listeners[evt] = fn;
      },
      ...extra
    };
    elements[id] = el;
    return el;
  }

  makeEl('auth-gate');
  makeEl('auth-form');
  makeEl('auth-password');
  makeEl('auth-error');
  elements['auth-error'].classList.add('hidden');
  makeEl('auth-submit');
  makeEl('logout-btn');

  const appLayout = makeEl('app-layout');

  (globalThis as any).document = {
    getElementById: (id: string) => elements[id] || null,
    querySelector: (sel: string) => {
      if (sel === '.app-layout') return appLayout;
      return null;
    }
  };
  (globalThis as any).window = {};

  // Track fetch calls
  let fetchCalls: Array<{ url: string; body: any }> = [];

  // 1. Test: verify returns false → shows login
  fetchCalls = [];
  (globalThis as any).fetch = async (url: string, opts: any) => {
    fetchCalls.push({ url, body: JSON.parse(opts.body) });
    return {
      ok: true,
      json: async () => ({ ok: true, valid: false })
    };
  };

  const script = fs.readFileSync('auth-ui.js', 'utf8');
  eval(script);

  // Wait for async init
  await new Promise(r => setTimeout(r, 50));

  assert.ok(!elements['auth-gate'].classList.contains('hidden'), 'Gate should be visible when session invalid');
  assert.equal(appLayout.style.display, 'none', 'App layout should be hidden');
  assert.equal(fetchCalls[0].body.action, 'verify', 'Should call verify on init');

  // 2. Test: login success → shows app
  fetchCalls = [];
  (globalThis as any).fetch = async (url: string, opts: any) => {
    fetchCalls.push({ url, body: JSON.parse(opts.body) });
    return {
      ok: true,
      json: async () => ({ ok: true })
    };
  };

  elements['auth-password'].value = 'testpassword';
  const submitHandler = elements['auth-form']._listeners?.['submit'];
  assert.ok(submitHandler, 'Form should have submit listener');
  await submitHandler({ preventDefault: () => {} });

  assert.ok(elements['auth-gate'].classList.contains('hidden'), 'Gate should be hidden after login');
  assert.notEqual(appLayout.style.display, 'none', 'App layout should be visible after login');
  assert.equal(fetchCalls[0].body.action, 'login', 'Should call login');
  assert.equal(fetchCalls[0].body.password, 'testpassword', 'Should send password');

  // 3. Test: login failure → shows error
  (globalThis as any).fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ ok: false, error: 'Unauthorized' })
  });

  elements['auth-password'].value = 'wrongpass';
  elements['auth-error'].classList.add('hidden');
  await submitHandler({ preventDefault: () => {} });

  assert.ok(!elements['auth-error'].classList.contains('hidden'), 'Error should be visible on failed login');

  // 4. Test: logout → shows login
  const logoutHandler = elements['logout-btn']._listeners?.['click'];
  assert.ok(logoutHandler, 'Logout button should have click listener');

  fetchCalls = [];
  (globalThis as any).fetch = async (url: string, opts: any) => {
    fetchCalls.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, json: async () => ({ ok: true }) };
  };

  await logoutHandler();
  assert.ok(!elements['auth-gate'].classList.contains('hidden'), 'Gate should be visible after logout');
  assert.equal(appLayout.style.display, 'none', 'App layout hidden after logout');
  assert.equal(fetchCalls[0].body.action, 'logout', 'Should call logout');

  // 5. Test: __revenueForceLogin is exposed
  assert.equal(typeof (globalThis as any).window.__revenueForceLogin, 'function', 'Should expose __revenueForceLogin');
});

test('auth-ui.js - verify success shows app directly', async () => {
  const elements: Record<string, any> = {};
  function makeEl(id: string) {
    const el: any = {
      id,
      classList: {
        _set: new Set(),
        add(c: string) { this._set.add(c); },
        remove(c: string) { this._set.delete(c); },
        contains(c: string) { return this._set.has(c); }
      },
      style: {},
      value: '',
      disabled: false,
      textContent: '',
      focus: () => {},
      addEventListener: () => {}
    };
    elements[id] = el;
    return el;
  }

  makeEl('auth-gate');
  makeEl('auth-form');
  makeEl('auth-password');
  makeEl('auth-error');
  makeEl('auth-submit');
  makeEl('logout-btn');
  const appLayout = makeEl('app-layout');

  (globalThis as any).document = {
    getElementById: (id: string) => elements[id] || null,
    querySelector: (sel: string) => sel === '.app-layout' ? appLayout : null
  };
  (globalThis as any).window = {};

  (globalThis as any).fetch = async () => ({
    ok: true,
    json: async () => ({ ok: true, valid: true })
  });

  const script = fs.readFileSync('auth-ui.js', 'utf8');
  eval(script);
  await new Promise(r => setTimeout(r, 50));

  assert.ok(elements['auth-gate'].classList.contains('hidden'), 'Gate hidden when session valid');
  assert.notEqual(appLayout.style.display, 'none', 'App visible when session valid');
});
