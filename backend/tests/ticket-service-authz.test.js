import test from 'node:test';
import assert from 'node:assert/strict';
import { __ticketServiceInternals } from '../src/services/ticketService.js';

const {
  normalizeDept,
  canViewTicket,
  canCommentTicket,
  canEditTicket,
  applyTicketScope,
} = __ticketServiceInternals;

test('normalizeDept normaliza texto de departamento', () => {
  assert.equal(normalizeDept(' ti '), 'TI');
});

test('canViewTicket permite solicitante ver próprio ticket', () => {
  const actor = { pdcUserId: 'u1', permittedDepartments: new Set() };
  const ticket = { solicitante_id: 'u1', area_destino: 'RH' };
  assert.equal(canViewTicket(actor, ticket), true);
});

test('canCommentTicket segue regra de visibilidade', () => {
  const actor = { pdcUserId: null, permittedDepartments: new Set(['TI']) };
  const ticket = { solicitante_id: 'u1', area_destino: 'ti' };
  assert.equal(canCommentTicket(actor, ticket), true);
});

test('canEditTicket exige departamento editável', () => {
  const actor = {
    pdcUserId: null,
    permittedDepartments: new Set(['TI']),
    editableDepartments: new Set(['TI']),
  };
  const ticket = { solicitante_id: 'u1', area_destino: 'TI' };
  assert.equal(canEditTicket(actor, ticket), true);
});

test('applyTicketScope aplica or quando há usuário e departamentos', () => {
  const called = { or: null };
  const query = {
    or(v) {
      called.or = v;
      return this;
    },
    eq() { return this; },
    in() { return this; },
  };
  const result = applyTicketScope(query, 'u1', new Set(['TI', 'RH']));
  assert.equal(result, query);
  assert.match(called.or, /solicitante_id\.eq\.u1/);
});
