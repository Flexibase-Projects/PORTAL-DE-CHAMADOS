import supabase from '../config/supabase.js';

function generateProtocol() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PDC-${y}${m}${d}-${rand}`;
}

export const ticketService = {
  async createTicket(data) {
    // Buscar user pelo email ou criar referência
    let solicitanteId = null;
    if (data.email) {
      const { data: user } = await supabase
        .from('PDC_users')
        .select('id')
        .eq('email', data.email)
        .single();
      solicitanteId = user?.id;
    }

    // Se não encontrou user, criar um temporário
    if (!solicitanteId) {
      const { data: roles } = await supabase
        .from('PDC_roles')
        .select('id')
        .eq('nome', 'usuario')
        .single();

      const { data: newUser, error: userErr } = await supabase
        .from('PDC_users')
        .upsert({
          nome: data.nome || 'Usuário',
          email: data.email,
          setor: data.setor || 'Administrativo',
          departamento: data.area || 'TI',
          ramal: data.ramal || null,
          role_id: roles?.id,
        }, { onConflict: 'email' })
        .select('id')
        .single();

      if (userErr) throw new Error(`Erro ao criar usuário: ${userErr.message}`);
      solicitanteId = newUser.id;
    }

    const ticket = {
      numero_protocolo: generateProtocol(),
      solicitante_id: solicitanteId,
      area_destino: data.area || data.area_destino,
      setor: data.setor,
      assunto: data.assunto,
      mensagem: data.mensagem,
      tipo_suporte: data.tipoSuporte || data.tipo_suporte || null,
      dados_extras: data.dadosExtras || data.dados_extras || {},
      status: 'Aberto',
      prioridade: data.prioridade || 'Normal',
    };

    const { data: created, error } = await supabase
      .from('PDC_tickets')
      .insert(ticket)
      .select('*')
      .single();

    if (error) throw new Error(`Erro ao criar ticket: ${error.message}`);
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
    const { data: ticket, error } = await supabase
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .eq('id', id)
      .single();

    if (error) return null;

    // Buscar respostas
    const { data: respostas } = await supabase
      .from('PDC_ticket_responses')
      .select(`*, autor:PDC_users!autor_id(nome)`)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    return {
      ...ticket,
      solicitante_nome: ticket.solicitante?.nome,
      solicitante_email: ticket.solicitante?.email,
      respostas: (respostas || []).map(r => ({
        ...r,
        autor_nome: r.autor?.nome || 'Administrador',
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
    const { data, error } = await supabase
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

  async updateTicketStatus(id, status) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'Concluído') {
      updates.closed_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('PDC_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  },

  async addResponse(ticketId, responseData) {
    // Buscar admin user ID
    let autorId = responseData.autor_id;
    if (!autorId || autorId === 'admin') {
      const { data: admin } = await supabase
        .from('PDC_users')
        .select('id')
        .eq('email', 'admin@portal.com')
        .single();
      autorId = admin?.id;
    }

    const { error: respErr } = await supabase
      .from('PDC_ticket_responses')
      .insert({
        ticket_id: ticketId,
        autor_id: autorId,
        mensagem: responseData.mensagem,
      });

    if (respErr) throw new Error(respErr.message);

    // Atualizar status se ainda estiver Aberto
    await supabase
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
};
