import supabase from '../config/supabase.js';

export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('PDC_users')
      .select(`*, role:PDC_roles!role_id(id, nome, descricao, nivel)`)
      .order('nome');

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('PDC_users')
      .select(`*, role:PDC_roles!role_id(id, nome, descricao, nivel)`)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async create(userData) {
    const { data, error } = await supabase
      .from('PDC_users')
      .insert({
        nome: userData.nome,
        email: userData.email,
        setor: userData.setor,
        departamento: userData.departamento,
        ramal: userData.ramal || null,
        role_id: userData.role_id,
      })
      .select(`*, role:PDC_roles!role_id(id, nome, descricao, nivel)`)
      .single();

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);
    return data;
  },

  async update(id, userData) {
    const { data, error } = await supabase
      .from('PDC_users')
      .update({
        nome: userData.nome,
        email: userData.email,
        setor: userData.setor,
        departamento: userData.departamento,
        ramal: userData.ramal || null,
        role_id: userData.role_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, role:PDC_roles!role_id(id, nome, descricao, nivel)`)
      .single();

    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    return data;
  },

  async toggleActive(id) {
    const user = await this.getById(id);
    if (!user) throw new Error('Usuário não encontrado');

    const { data, error } = await supabase
      .from('PDC_users')
      .update({ ativo: !user.ativo, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`*, role:PDC_roles!role_id(id, nome, descricao, nivel)`)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async getRoles() {
    const { data, error } = await supabase
      .from('PDC_roles')
      .select('*')
      .order('nivel', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Vincula auth_user_id ao PDC_users pelo email (para "meus chamados" funcionar).
   */
  async syncAuthUser(authUserId, email, nome) {
    if (!authUserId || !email) return null;
    const { data: existing } = await supabase
      .from('PDC_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      const { data: updated } = await supabase
        .from('PDC_users')
        .update({ auth_user_id: authUserId, nome: nome || existing.nome, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      return updated;
    }
    const { data: roles } = await supabase.from('PDC_roles').select('id').eq('nome', 'usuario').single();
    const { data: created } = await supabase
      .from('PDC_users')
      .insert({
        nome: nome || email.split('@')[0],
        email,
        auth_user_id: authUserId,
        setor: 'Administrativo',
        departamento: '',
        role_id: roles?.id,
      })
      .select()
      .single();
    return created;
  },
};
