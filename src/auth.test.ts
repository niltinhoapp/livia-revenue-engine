import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _setEnv,
  verifyPassword,
  createSessionCookieValue,
  verifySessionCookieValue,
  getSetCookieHeader,
  requireRevenueSession
} from './auth.js';

test('auth - verifyPassword correctly validates password', () => {
  _setEnv('supersecret123', 'sessionsecret456');
  
  assert.equal(verifyPassword('supersecret123'), true);
  assert.equal(verifyPassword('wrongpassword'), false);
  assert.equal(verifyPassword(''), false);
});

test('auth - session cookie creation and validation', () => {
  _setEnv('access', 'sessionsecret456');
  
  const cookieVal = createSessionCookieValue();
  const [payload, signature] = cookieVal.split('.');
  assert.ok(payload);
  assert.ok(signature);
  
  // Valid cookie is accepted
  assert.equal(verifySessionCookieValue(cookieVal), true);
});

test('auth - rejects forged cookie', () => {
  _setEnv('access', 'sessionsecret456');
  
  const cookieVal = createSessionCookieValue();
  const [payload, signature] = cookieVal.split('.');
  
  // Altering payload invalidates signature
  const forged = `${Number(payload) + 1000}.${signature}`;
  assert.equal(verifySessionCookieValue(forged), false);
  
  // Altering signature
  const forgedSig = `${payload}.abcdef123456`;
  assert.equal(verifySessionCookieValue(forgedSig), false);
});

test('auth - rejects expired cookie', () => {
  _setEnv('access', 'sessionsecret456');
  
  const expiredExp = Date.now() - 1000;
  const expiredCookie = createSessionCookieValue(expiredExp);
  
  assert.equal(verifySessionCookieValue(expiredCookie), false);
});

test('auth - rejects missing or malformed cookie', () => {
  _setEnv('access', 'sessionsecret456');
  
  assert.equal(verifySessionCookieValue(undefined), false);
  assert.equal(verifySessionCookieValue(''), false);
  assert.equal(verifySessionCookieValue('justpayload'), false);
  assert.equal(verifySessionCookieValue('part1.part2.part3'), false);
});

test('auth - getSetCookieHeader attributes', () => {
  const originalEnv = process.env.NODE_ENV;
  
  // Dev mode
  process.env.NODE_ENV = 'development';
  const devHeader = getSetCookieHeader('mycookie', 10000);
  assert.ok(devHeader.includes('revenuesid=mycookie'));
  assert.ok(devHeader.includes('HttpOnly'));
  assert.ok(devHeader.includes('SameSite=Lax'));
  assert.ok(!devHeader.includes('Secure'));
  assert.ok(devHeader.includes('Max-Age=10'));
  
  // Prod mode
  process.env.NODE_ENV = 'production';
  const prodHeader = getSetCookieHeader('mycookie', 10000);
  assert.ok(prodHeader.includes('Secure'));
  
  process.env.NODE_ENV = originalEnv;
});

test('auth - getSetCookieHeader contains no secret', () => {
  _setEnv('acc', 'ses');
  const header = getSetCookieHeader('someval', 10);
  assert.ok(!header.includes('acc'));
  assert.ok(!header.includes('ses'));
});

test('auth - requireRevenueSession helper', () => {
  _setEnv('access', 'sessionsecret456');
  
  const validCookie = createSessionCookieValue();
  let statusSet = 0;
  let jsonCalled = false;
  
  const res = {
    status: (s: number) => { statusSet = s; return res; },
    json: () => { jsonCalled = true; return res; }
  };
  
  // With missing cookie
  const reqNoCookie = { cookies: {} };
  assert.equal(requireRevenueSession(reqNoCookie as any, res as any), false);
  assert.equal(statusSet, 401);
  assert.equal(jsonCalled, true);
  
  // With valid cookie
  const reqValid = { cookies: { revenuesid: validCookie } };
  statusSet = 0;
  jsonCalled = false;
  assert.equal(requireRevenueSession(reqValid as any, res as any), true);
  assert.equal(statusSet, 0);
  assert.equal(jsonCalled, false);
});
