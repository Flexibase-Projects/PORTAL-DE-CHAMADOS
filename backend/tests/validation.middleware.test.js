import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validateTicket, validateResponse, validateStatusChange } from '../src/middleware/validation.js';

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

test('validateTicket bloqueia payload incompleto', () => {
  const req = { body: { nome: '', email: 'x', assunto: '', mensagem: '' } };
  const res = createMockRes();
  let nextCalled = false;
  validateTicket(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.payload?.errors));
  assert.ok(res.payload.errors.length > 0);
});

test('validateTicket permite payload válido', () => {
  const req = {
    body: {
      nome: 'Usuário Teste',
      email: 'user@test.com',
      setor: 'Administrativo',
      area: 'TI',
      assunto: 'Teste',
      mensagem: 'Mensagem',
    },
  };
  const res = createMockRes();
  let nextCalled = false;
  validateTicket(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('validateResponse bloqueia mensagem vazia', () => {
  const req = { body: { mensagem: '   ' } };
  const res = createMockRes();
  let nextCalled = false;
  validateResponse(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test('validateResponse permite mensagem válida', () => {
  const req = { body: { mensagem: 'ok' } };
  const res = createMockRes();
  let nextCalled = false;
  validateResponse(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('validateStatusChange bloqueia ausência de status', () => {
  const req = { body: { mensagem: 'ok' } };
  const res = createMockRes();
  let nextCalled = false;
  validateStatusChange(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test('validateStatusChange bloqueia ausência de mensagem', () => {
  const req = { body: { status: 'Aberto', mensagem: '   ' } };
  const res = createMockRes();
  let nextCalled = false;
  validateStatusChange(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});
