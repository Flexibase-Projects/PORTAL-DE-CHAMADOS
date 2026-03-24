import supabase from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

function generateProtocol() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PDC-${y}${m}${d}-${rand}`;
}

const TICKET_SELECT_BASE = `*, solicitante:PDC_users!solicitante_id(nome, email)`;
const TICKET_SELECT_WITH_RESP = `${TICKET_SELECT_BASE}, responsavel:PDC_users!responsavel_id(nome, email)`;

function isMissingResponsavelColumnError(error) {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return msg.includes('responsavel_id') || msg.includes('pdc_tickets.responsavel_id');
}

function mapTicketWithJoins(t) {
  return {
    ...t,
    solicitante_nome: t.solicitante?.nome,
    solicitante_email: t.solicitante?.email,
    responsavel_nome: t.responsavel?.nome || null,
    responsavel_email: t.responsavel?.email || null,
  };
}

/** Notifica todos os PDC_users com auth vinculado ao departamento receptor (area_destino), exceto excludePdcUserId. */
async function notifyPdcUsersInDestinationDepartment(client, {
  areaDestino,
  ticketId,
  numeroProtocolo,
  assunto,
  excludePdcUserId,
  tipo,
  titulo,
}) {
  if (!areaDestino || !String(areaDestino).trim()) return;
  const areaNorm = String(areaDestino).trim().toUpperCase();
  const { data: receptores } = await client
    .from('PDC_users')
    .select('id, auth_user_id, departamento')
    .not('auth_user_id', 'is', null);
  const receptoresDoSetor = (receptores || []).filter(
    (u) => (u.departamento || '').trim().toUpperCase() === areaNorm && u.id !== excludePdcUserId
  );
  if (receptoresDoSetor.length === 0) return;
  const authIds = [...new Set(receptoresDoSetor.map((u) => u.auth_user_id).filter(Boolean))];
  const rows = authIds.map((auth_user_id) => ({
    auth_user_id,
    tipo,
    ticket_id: ticketId,
    titulo,
    mensagem: `Chamado ${numeroProtocolo}: ${(assunto || '').slice(0, 60)}...`,
  }));
  const { error } = await client.from('PDC_notifications').insert(rows);
  if (error) console.error('[notifyPdcUsersInDestinationDepartment]', error.message);
}

export const ticketService = {
  async createTicket(data, authUserId = null) {
    const client = supabaseAdmin || supabase;
    const emailNorm = (data.email || '').trim().toLowerCase() || null;
    let solicitanteId = null;
    if (emailNorm || (data.email || '').trim()) {
      const emailRaw = (data.email || '').trim();
      let user = (await client.from('PDC_users').select('id').eq('email', emailNorm || emailRaw).maybeSingle()).data;
      if (!user?.id && emailRaw && emailRaw !== (emailNorm || emailRaw)) {
        user = (await client.from('PDC_users').select('id').eq('email', emailRaw).maybeSingle()).data;
      }
      solicitanteId = user?.id ?? null;
    }

    if (!solicitanteId) {
      const { data: roles } = await client
        .from('PDC_roles')
        .select('id')
        .eq('nome', 'usuario')
        .maybeSingle();

      const departamentoSolicitante = (data.area_origem || data.area || data.area_destino || 'TI').trim() || 'TI';
      const setorSolicitante = (data.setor_origem || data.setor || 'Administrativo').trim() || 'Administrativo';
      const { data: newUser, error: userErr } = await client
        .from('PDC_users')
        .upsert({
          nome: data.nome || 'Usuário',
          email: emailNorm || (data.email || '').trim(),
          setor: setorSolicitante,
          departamento: departamentoSolicitante,
          ramal: data.ramal || null,
          role_id: roles?.id,
          ...(authUserId && { auth_user_id: authUserId }),
        }, { onConflict: 'email' })
        .select('id')
        .single();

      if (userErr) throw new Error(`Erro ao criar usuário: ${userErr.message}`);
      solicitanteId = newUser.id;
    } else if (authUserId && solicitanteId) {
      const { error: updateErr } = await client
        .from('PDC_users')
        .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
        .eq('id', solicitanteId)
        .select();
      if (updateErr) throw new Error(`Erro ao vincular usuário ao chamado: ${updateErr.message}`);
    }

    const areaDestino = (data.area_destino || data.area || '').trim() || 'TI';
    const ticket = {
      numero_protocolo: generateProtocol(),
      solicitante_id: solicitanteId,
      area_destino: areaDestino,
      setor: (data.setor_destino || data.setor || 'Administrativo').trim() || 'Administrativo',
      assunto: data.assunto,
      mensagem: data.mensagem,
      tipo_suporte: data.tipoSuporte || data.tipo_suporte || null,
      dados_extras: data.dadosExtras || data.dados_extras || {},
      status: 'Aberto',
      prioridade: data.prioridade || 'Normal',
    };

    const { data: created, error } = await client
      .from('PDC_tickets')
      .insert(ticket)
      .select('*')
      .single();

    if (error) throw new Error(`Erro ao criar ticket: ${error.message}`);

    await client.from('PDC_ticket_activities').insert({
      ticket_id: created.id,
      tipo: 'criado',
      autor_id: solicitanteId,
      detalhes: {},
    });

    await notifyPdcUsersInDestinationDepartment(client, {
      areaDestino: created.area_destino,
      ticketId: created.id,
      numeroProtocolo: created.numero_protocolo,
      assunto: created.assunto,
      excludePdcUserId: solicitanteId,
      tipo: 'novo_chamado',
      titulo: 'Novo chamado',
    });

    return created;
  },

  async getAllTickets() {
    let { data, error } = await supabase
      .from('PDC_tickets')
      .select(TICKET_SELECT_WITH_RESP)
      .order('created_at', { ascending: false });
    if (error && isMissingResponsavelColumnError(error)) {
      ({ data, error } = await supabase
        .from('PDC_tickets')
        .select(TICKET_SELECT_BASE)
        .order('created_at', { ascending: false }));
    }

    if (error) throw new Error(error.message);
    return (data || []).map(mapTicketWithJoins);
  },

  async getTicketById(id) {
    const client = supabaseAdmin || supabase;
    let { data: ticket, error } = await client
      .from('PDC_tickets')
      .select(TICKET_SELECT_WITH_RESP)
      .eq('id', id)
      .single();
    if (error && isMissingResponsavelColumnError(error)) {
      ({ data: ticket, error } = await client
        .from('PDC_tickets')
        .select(TICKET_SELECT_BASE)
        .eq('id', id)
        .single());
    }

    if (error || !ticket) return null;

    // Buscar respostas
    const { data: respostas } = await client
      .from('PDC_ticket_responses')
      .select(`*, autor:PDC_users!autor_id(nome, email)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    // Buscar atividades (histórico)
    const { data: atividades } = await client
      .from('PDC_ticket_activities')
      .select(`*, autor:PDC_users!autor_id(nome)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    return {
      ...mapTicketWithJoins(ticket),
      respostas: (respostas || []).map(r => ({
        ...r,
        autor_nome: r.autor?.nome || 'Administrador',
        autor_email: r.autor?.email || null,
      })),
      atividades: (atividades || []).map(a => ({
        id: a.id,
        tipo: a.tipo,
        autor_id: a.autor_id,
        autor_nome: a.autor?.nome || 'Sistema',
        created_at: a.created_at,
        detalhes: a.detalhes || {},
      })),
    };
  },

  async getTicketsByNome(nome) {
    const nomeTrim = (nome || '').trim();
    if (!nomeTrim) return [];

    const { data: users } = await supabase
      .from('PDC_users')
      .select('id')
      .ilike('nome', nomeTrim);

    if (!users?.length) return [];

    const ids = users.map(u => u.id);
    let { data, error } = await supabase
      .from('PDC_tickets')
      .select(TICKET_SELECT_WITH_RESP)
      .in('solicitante_id', ids)
      .order('created_at', { ascending: false });
    if (error && isMissingResponsavelColumnError(error)) {
      ({ data, error } = await supabase
        .from('PDC_tickets')
        .select(TICKET_SELECT_BASE)
        .in('solicitante_id', ids)
        .order('created_at', { ascending: false }));
    }

    if (error) throw new Error(error.message);
    return (data || []).map(mapTicketWithJoins);
  },

  /**
   * Chamados "recebidos" na gestão: apenas não concluídos em que o usuário é
   * remetente (solicitante) ou destinatário (departamento = area_destino).
   * Mesma regra de visibilidade de getMeusChamadosByAuthUser.
   */
  async getReceivedTickets(authUserId, authUserEmail = null) {
    if (!authUserId) return [];
    const result = await this.getMeusChamadosByAuthUser(authUserId, authUserEmail);
    const seen = new Set();
    const merged = [];
    for (const t of [...(result.chamadosMeuDepartamento || []), ...(result.chamadosQueAbriOutros || [])]) {
      if (t.status === 'Concluído') continue;
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      merged.push(t);
    }
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return merged;
  },

  /**
   * Mesma visibilidade de getReceivedTickets, apenas chamados Concluído (gestão: histórico).
   */
  async getReceivedConcludedTickets(authUserId, authUserEmail = null) {
    if (!authUserId) return [];
    const result = await this.getMeusChamadosByAuthUser(authUserId, authUserEmail);
    const seen = new Set();
    const merged = [];
    for (const t of [...(result.chamadosMeuDepartamento || []), ...(result.chamadosQueAbriOutros || [])]) {
      if (t.status !== 'Concluído') continue;
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      merged.push(t);
    }
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return merged;
  },

  async _resolveAutorId(client, authUserId, authUserEmail) {
    let autorId = null;
    if (authUserId) {
      const pdcUser = (await client.from('PDC_users').select('id').eq('auth_user_id', authUserId).maybeSingle()).data;
      if (pdcUser?.id) autorId = pdcUser.id;
    }
    if (!autorId && authUserEmail) {
      const emailTrim = (authUserEmail || '').trim().toLowerCase();
      const pdcUser = (await client.from('PDC_users').select('id').eq('email', emailTrim).maybeSingle()).data;
      if (!pdcUser?.id && authUserEmail.trim() !== emailTrim) {
        const alt = (await client.from('PDC_users').select('id').eq('email', authUserEmail.trim()).maybeSingle()).data;
        if (alt?.id) autorId = alt.id;
      } else if (pdcUser?.id) autorId = pdcUser.id;
    }
    if (!autorId) {
      const admin = (await client.from('PDC_users').select('id').eq('email', 'admin@portal.com').maybeSingle()).data;
      autorId = admin?.id;
    }
    return autorId;
  },

  async updateTicketStatus(id, status, authUserId = null, authUserEmail = null) {
    const client = supabaseAdmin || supabase;
    const { data: current } = await client.from('PDC_tickets').select('status').eq('id', id).single();
    const statusAnterior = current?.status || null;

    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'Concluído') {
      updates.closed_at = new Date().toISOString();
    }
    const { data, error } = await client
      .from('PDC_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;

    const autorId = await this._resolveAutorId(client, authUserId, authUserEmail);
    await client.from('PDC_ticket_activities').insert({
      ticket_id: id,
      tipo: 'status_alterado',
      autor_id: autorId,
      detalhes: { status_anterior: statusAnterior, status_novo: status },
    });

    return this.getTicketById(id);
  },

  async addResponse(ticketId, responseData, authUserId = null, authUserEmail = null) {
    const client = supabaseAdmin || supabase;

    let autorId = responseData.autor_id;
    if (!autorId || autorId === 'current') {
      autorId = await this._resolveAutorId(client, authUserId, authUserEmail);
    }
    if (!autorId) throw new Error('Não foi possível identificar o autor da resposta. Faça login novamente.');

    const { data: insertedResponse, error: respErr } = await client
      .from('PDC_ticket_responses')
      .insert({
        ticket_id: ticketId,
        autor_id: autorId,
        mensagem: responseData.mensagem,
      })
      .select('id')
      .single();

    if (respErr) throw new Error(respErr.message);

    const msgPreview = (responseData.mensagem || '').slice(0, 300);
    await client.from('PDC_ticket_activities').insert({
      ticket_id: ticketId,
      tipo: 'comentario',
      autor_id: autorId,
      detalhes: { response_id: insertedResponse?.id, mensagem: msgPreview },
    });

    // Notificar o solicitante sobre nova resposta (se tiver auth_user_id)
    let { data: ticketRow, error: ticketRowErr } = await client
      .from('PDC_tickets')
      .select('solicitante_id, area_destino, numero_protocolo, assunto, responsavel_id')
      .eq('id', ticketId)
      .single();
    if (ticketRowErr && isMissingResponsavelColumnError(ticketRowErr)) {
      const fallback = await client
        .from('PDC_tickets')
        .select('solicitante_id, area_destino, numero_protocolo, assunto')
        .eq('id', ticketId)
        .single();
      ticketRow = fallback.data ? { ...fallback.data, responsavel_id: null } : null;
      ticketRowErr = fallback.error;
    }
    if (ticketRowErr) throw new Error(ticketRowErr.message);

    // Autoatribuição na primeira resposta: somente se autor for do departamento receptor.
    if (!ticketRow?.responsavel_id && ticketRow?.area_destino && autorId) {
      const areaNorm = (ticketRow.area_destino || '').trim().toUpperCase();
      const { data: autorRow } = await client
        .from('PDC_users')
        .select('id, departamento')
        .eq('id', autorId)
        .maybeSingle();
      const autorDeptNorm = (autorRow?.departamento || '').trim().toUpperCase();
      if (autorRow?.id && autorDeptNorm === areaNorm) {
        const updateResult = await client
          .from('PDC_tickets')
          .update({ responsavel_id: autorRow.id, updated_at: new Date().toISOString() })
          .eq('id', ticketId)
          .is('responsavel_id', null);
        if (updateResult.error && !isMissingResponsavelColumnError(updateResult.error)) {
          throw new Error(updateResult.error.message);
        }
      }
    }
    if (ticketRow?.solicitante_id) {
      const { data: pdcUser } = await client.from('PDC_users').select('auth_user_id').eq('id', ticketRow.solicitante_id).single();
      const remetenteEhSolicitante =
        ticketRow.solicitante_id === autorId ||
        (authUserId && pdcUser?.auth_user_id && pdcUser.auth_user_id === authUserId);
      if (pdcUser?.auth_user_id && !remetenteEhSolicitante) {
        await client.from('PDC_notifications').insert({
          auth_user_id: pdcUser.auth_user_id,
          tipo: 'resposta_chamado',
          ticket_id: ticketId,
          titulo: 'Nova resposta no chamado',
          mensagem: `Chamado ${ticketRow.numero_protocolo}: ${(ticketRow.assunto || '').slice(0, 60)}...`,
        });
      }
    }

    await notifyPdcUsersInDestinationDepartment(client, {
      areaDestino: ticketRow?.area_destino,
      ticketId,
      numeroProtocolo: ticketRow.numero_protocolo,
      assunto: ticketRow.assunto,
      excludePdcUserId: autorId,
      tipo: 'resposta_chamado',
      titulo: 'Nova resposta no chamado',
    });

    // Atualizar status se ainda estiver Aberto
    await client
      .from('PDC_tickets')
      .update({
        status: 'Em Andamento',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('status', 'Aberto');

    return this.getTicketById(ticketId);
  },

  async getTicketsByArea(area) {
    let { data, error } = await supabase
      .from('PDC_tickets')
      .select(TICKET_SELECT_WITH_RESP)
      .eq('area_destino', area)
      .order('created_at', { ascending: false });
    if (error && isMissingResponsavelColumnError(error)) {
      ({ data, error } = await supabase
        .from('PDC_tickets')
        .select(TICKET_SELECT_BASE)
        .eq('area_destino', area)
        .order('created_at', { ascending: false }));
    }

    if (error) throw new Error(error.message);
    return (data || []).map(mapTicketWithJoins);
  },

  /**
   * Meus chamados por usuário autenticado (auth_user_id).
   * Visibilidade baseada apenas em PDC_users.departamento (sem exigir PDC_user_permissions).
   * - chamadosMeuDepartamento: chamados cujo area_destino é o departamento do usuário (PDC_users.departamento).
   * - chamadosQueAbriOutros: chamados que o usuário abriu (solicitante_id) para outros departamentos.
   */
  async getMeusChamadosByAuthUser(authUserId, authUserEmail = null) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!authUserId) {
      if (isDev) console.debug('[ticketService] getMeusChamadosByAuthUser: authUserId ausente');
      return { chamadosMeuDepartamento: [], chamadosQueAbriOutros: [] };
    }

    const client = supabaseAdmin || supabase;

    let pdcUser = (await client
      .from('PDC_users')
      .select('id, departamento')
      .eq('auth_user_id', authUserId)
      .maybeSingle()).data;
    if (!pdcUser?.id && supabaseAdmin) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      const email = authUser?.user?.email;
      if (email) {
        const { data: byEmail } = await client
          .from('PDC_users')
          .select('id, departamento')
          .eq('email', email)
          .maybeSingle();
        if (byEmail) pdcUser = byEmail;
      }
    }
    if (!pdcUser?.id && authUserEmail) {
      const emailTrim = authUserEmail.trim();
      let byEmail = (await client.from('PDC_users').select('id, departamento').eq('email', emailTrim).maybeSingle()).data;
      if (!byEmail?.id && emailTrim.toLowerCase() !== emailTrim) {
        byEmail = (await client.from('PDC_users').select('id, departamento').eq('email', emailTrim.toLowerCase()).maybeSingle()).data;
      }
      if (byEmail?.id) {
        pdcUser = byEmail;
        const { error: updateErr } = await client
          .from('PDC_users')
          .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
          .eq('id', pdcUser.id);
        if (!updateErr && isDev) console.debug('[ticketService] getMeusChamadosByAuthUser: PDC_users encontrado por email e auth_user_id vinculado');
      }
    }
    const solicitanteId = pdcUser?.id || null;
    if (isDev && !pdcUser?.id) console.debug('[ticketService] getMeusChamadosByAuthUser: PDC_users não encontrado para auth_user_id');
    if (isDev && !solicitanteId) console.debug('[ticketService] getMeusChamadosByAuthUser: solicitanteId null — "chamados que abri" ficará vazio');

    const permittedSet = new Set();
    if (pdcUser?.departamento?.trim()) permittedSet.add(pdcUser.departamento.trim().toUpperCase());

    const norm = (v) => (v || '').trim().toUpperCase();

    const formatTicket = (t) => mapTicketWithJoins(t);

    const ticketClient = supabaseAdmin || client;
    let { data: allTickets, error } = await ticketClient
      .from('PDC_tickets')
      .select(TICKET_SELECT_WITH_RESP)
      .order('created_at', { ascending: false });
    if (error && isMissingResponsavelColumnError(error)) {
      ({ data: allTickets, error } = await ticketClient
        .from('PDC_tickets')
        .select(TICKET_SELECT_BASE)
        .order('created_at', { ascending: false }));
    }

    if (error) throw new Error(error.message);
    const list = (allTickets || []).map(formatTicket);

    const chamadosMeuDepartamento = list.filter((t) => permittedSet.has(norm(t.area_destino)));
    const chamadosQueAbriOutros = solicitanteId
      ? list.filter((t) => t.solicitante_id === solicitanteId && !permittedSet.has(norm(t.area_destino)))
      : [];

    const permissoesPorDepartamento = await this._getPermissoesMap(authUserId);
    if (pdcUser?.departamento?.trim()) {
      const dept = pdcUser.departamento.trim();
      const deptUpper = dept.toUpperCase();
      if (!permissoesPorDepartamento[dept]) permissoesPorDepartamento[dept] = 'view_edit';
      if (!permissoesPorDepartamento[deptUpper]) permissoesPorDepartamento[deptUpper] = 'view_edit';
    }

    return {
      chamadosMeuDepartamento,
      chamadosQueAbriOutros,
      permissoesPorDepartamento,
    };
  },

  async _getPermissoesMap(authUserId) {
    const client = supabaseAdmin || supabase;
    const { data } = await client
      .from('PDC_user_permissions')
      .select('departamento, permissao')
      .eq('auth_user_id', authUserId);
    const map = {};
    (data || []).forEach((r) => { map[r.departamento] = r.permissao; });
    return map;
  },
};
