import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validateStatusChange } from '../src/middleware/validation.js';

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

test('validateEmail aceita email válido', () => {
  assert.equal(validateEmail('user@example.com'), true);
});

test('validateEmail rejeita email inválido', () => {
  assert.equal(validateEmail('user@@example'), false);
});

test('validateStatusChange bloqueia status inválido', () => {
  const req = { body: { status: 'Inexistente', mensagem: 'x' } };
  const res = createMockRes();
  let nextCalled = false;
  validateStatusChange(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload?.success, false);
});

test('validateStatusChange permite payload válido', () => {
  const req = { body: { status: 'Concluído', mensagem: 'resolvido' } };
  const res = createMockRes();
  let nextCalled = false;
  validateStatusChange(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(res.payload, null);
});
