import test from 'node:test';
import assert from 'node:assert/strict';
import supabase from '../src/config/supabase.js';
import { requireAuth } from '../src/middleware/auth.js';

function createMockRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

test('requireAuth retorna 401 sem Bearer', async () => {
  const req = { headers: {} };
  const res = createMockRes();
  let nextCalled = false;
  await requireAuth(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('requireAuth retorna 401 com token inválido', async () => {
  const originalGetUser = supabase.auth.getUser;
  supabase.auth.getUser = async () => ({ data: { user: null }, error: new Error('invalid token') });
  const req = { headers: { authorization: 'Bearer invalid-token' } };
  const res = createMockRes();
  let nextCalled = false;
  await requireAuth(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  supabase.auth.getUser = originalGetUser;
});

test('requireAuth segue fluxo com token válido', async () => {
  const originalGetUser = supabase.auth.getUser;
  supabase.auth.getUser = async () => ({ data: { user: { id: 'user-1' } }, error: null });
  const req = { headers: { authorization: 'Bearer valid-token' } };
  const res = createMockRes();
  let nextCalled = false;
  await requireAuth(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.auth?.user?.id, 'user-1');
  supabase.auth.getUser = originalGetUser;
});
