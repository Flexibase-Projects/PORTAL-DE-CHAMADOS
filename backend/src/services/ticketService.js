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

    return created;
  },

  async getAllTickets() {
    const { data, error } = await supabase
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(t => ({
      ...t,
      solicitante_nome: t.solicitante?.nome,
      solicitante_email: t.solicitante?.email,
    }));
  },

  async getTicketById(id) {
    const client = supabaseAdmin || supabase;
    const { data: ticket, error } = await client
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .eq('id', id)
      .single();

    if (error || !ticket) return null;

    // Buscar respostas
    const { data: respostas } = await client
      .from('PDC_ticket_responses')
      .select(`*, autor:PDC_users!autor_id(nome)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    // Buscar atividades (histórico)
    const { data: atividades } = await client
      .from('PDC_ticket_activities')
      .select(`*, autor:PDC_users!autor_id(nome)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    return {
      ...ticket,
      solicitante_nome: ticket.solicitante?.nome,
      solicitante_email: ticket.solicitante?.email,
      respostas: (respostas || []).map(r => ({
        ...r,
        autor_nome: r.autor?.nome || 'Administrador',
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
    const { data, error } = await supabase
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .in('solicitante_id', ids)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(t => ({
      ...t,
      solicitante_nome: t.solicitante?.nome,
      solicitante_email: t.solicitante?.email,
    }));
  },

  async getReceivedTickets() {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .neq('status', 'Concluído')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(t => ({
      ...t,
      solicitante_nome: t.solicitante?.nome,
      solicitante_email: t.solicitante?.email,
    }));
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
    const { data: ticketRow } = await client.from('PDC_tickets').select('solicitante_id, numero_protocolo, assunto').eq('id', ticketId).single();
    if (ticketRow?.solicitante_id) {
      const { data: pdcUser } = await client.from('PDC_users').select('auth_user_id').eq('id', ticketRow.solicitante_id).single();
      if (pdcUser?.auth_user_id) {
        await client.from('PDC_notifications').insert({
          auth_user_id: pdcUser.auth_user_id,
          tipo: 'resposta_chamado',
          ticket_id: ticketId,
          titulo: 'Nova resposta no chamado',
          mensagem: `Chamado ${ticketRow.numero_protocolo}: ${(ticketRow.assunto || '').slice(0, 60)}...`,
        });
      }
    }

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
    const { data, error } = await supabase
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .eq('area_destino', area)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(t => ({
      ...t,
      solicitante_nome: t.solicitante?.nome,
      solicitante_email: t.solicitante?.email,
    }));
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

    const formatTicket = (t) => ({
      ...t,
      solicitante_nome: t.solicitante?.nome,
      solicitante_email: t.solicitante?.email,
    });

    const ticketClient = supabaseAdmin || client;
    const { data: allTickets, error } = await ticketClient
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .order('created_at', { ascending: false });

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
