import test from 'node:test';
import assert from 'node:assert/strict';
import { attachActor, requireTiUser } from '../src/middleware/authorization.js';
import { permissionService } from '../src/services/permissionService.js';

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

test('attachActor anexa ator com permissões', async () => {
  const original = permissionService.getByAuthUserId;
  permissionService.getByAuthUserId = async () => ({
    userDepartamento: 'TI',
    permissions: { TI: 'view_edit' },
  });
  const req = { auth: { user: { id: 'auth-1' } } };
  await attachActor(req, {}, () => {});
  assert.equal(req.actor?.authUserId, 'auth-1');
  assert.equal(req.actor?.userDepartamento, 'TI');
  permissionService.getByAuthUserId = original;
});

test('requireTiUser retorna 403 quando não é TI', async () => {
  const req = { actor: { userDepartamento: 'RH' } };
  const res = createMockRes();
  let nextCalled = false;
  await requireTiUser(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('requireTiUser segue quando é TI', async () => {
  const req = { actor: { userDepartamento: 'TI' } };
  const res = createMockRes();
  let nextCalled = false;
  await requireTiUser(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(res.payload, null);
});
