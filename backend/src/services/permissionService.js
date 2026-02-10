import supabase from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const PERMISSAO_VALIDAS = ['view', 'view_edit'];

export const permissionService = {
  /**
   * Lista usuários do Supabase Auth (requer service_role).
   * Retorna id, email, user_metadata (nome etc.) para o admin gerenciar permissões.
   */
  async listAuthUsers() {
    if (!supabaseAdmin) {
      return [];
    }
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(`Erro ao listar usuários Auth: ${error.message}`);
    return (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      nome: u.user_metadata?.nome || u.user_metadata?.full_name || u.email?.split('@')[0] || '—',
      created_at: u.created_at,
    }));
  },

  /**
   * Retorna permissões por departamento para um auth_user_id.
   */
  async getByAuthUserId(authUserId) {
    const { data, error } = await supabase
      .from('PDC_user_permissions')
      .select('departamento, permissao')
      .eq('auth_user_id', authUserId)
      .order('departamento');

    if (error) throw new Error(error.message);
    const map = {};
    (data || []).forEach((row) => {
      map[row.departamento] = row.permissao;
    });
    return map;
  },

  /**
   * Atualiza permissões para um auth_user_id.
   * body: { departamentos: { [departamento]: 'view' | 'view_edit' } }
   */
  async setForAuthUser(authUserId, departamentos) {
    if (!authUserId) throw new Error('auth_user_id é obrigatório');

    const rows = [];
    for (const [departamento, permissao] of Object.entries(departamentos || {})) {
      if (!departamento?.trim() || !PERMISSAO_VALIDAS.includes(permissao)) continue;
      rows.push({
        auth_user_id: authUserId,
        departamento: departamento.trim(),
        permissao,
        updated_at: new Date().toISOString(),
      });
    }

    const { error: deleteErr } = await supabase
      .from('PDC_user_permissions')
      .delete()
      .eq('auth_user_id', authUserId);

    if (deleteErr) throw new Error(deleteErr.message);

    if (rows.length === 0) return {};

    const { error: insertErr } = await supabase
      .from('PDC_user_permissions')
      .upsert(rows, { onConflict: 'auth_user_id,departamento' });

    if (insertErr) throw new Error(insertErr.message);

    return this.getByAuthUserId(authUserId);
  },
};
