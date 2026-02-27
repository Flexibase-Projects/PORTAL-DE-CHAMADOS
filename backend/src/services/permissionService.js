import supabase from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const PERMISSAO_VALIDAS = ['view', 'view_edit'];

export const permissionService = {
  /**
   * Lista usuários do Supabase Auth (requer service_role).
   * Se SUPABASE_SERVICE_ROLE_KEY não estiver definida, retorna usuários de PDC_users que têm auth_user_id (já fizeram login).
   */
  async listAuthUsers() {
    if (supabaseAdmin) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw new Error(`Auth: ${error.message}`);
      const ids = (users || []).map((u) => u.id);
      let departamentoByAuthId = {};
      if (ids.length > 0) {
        const { data: pdcRows } = await supabaseAdmin
          .from('PDC_users')
          .select('auth_user_id, departamento')
          .in('auth_user_id', ids);
        departamentoByAuthId = (pdcRows || []).reduce((acc, r) => {
          if (r.auth_user_id && r.departamento?.trim()) acc[r.auth_user_id] = r.departamento.trim();
          return acc;
        }, {});
      }
      return (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome || u.user_metadata?.full_name || u.email?.split('@')[0] || '—',
        created_at: u.created_at,
        departamento: departamentoByAuthId[u.id] || null,
      }));
    }
    // Fallback: listar de PDC_users (quem já fez login e sincronizou). Exige configurar SERVICE_ROLE_KEY para ver todos do Auth.
    const { data: rows, error } = await supabase
      .from('PDC_users')
      .select('auth_user_id, email, nome, created_at, departamento')
      .not('auth_user_id', 'is', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (rows || []).map((r) => ({
      id: r.auth_user_id,
      email: r.email ?? '',
      nome: r.nome || r.email?.split('@')[0] || '—',
      created_at: r.created_at,
      departamento: r.departamento?.trim() || null,
    }));
  },

  /**
   * Retorna apenas o departamento do usuário (PDC_users.departamento). Usado para checagem de TI/admin.
   * Se não encontrar por auth_user_id, tenta buscar por e-mail (Auth) para cobrir sync pendente.
   */
  async getDepartamentoByAuthUserId(authUserId) {
    if (!authUserId) return null;
    const client = supabaseAdmin || supabase;
    const { data } = await client
      .from('PDC_users')
      .select('departamento')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    const dept = data?.departamento?.trim() || null;
    if (dept) return dept;
    if (!supabaseAdmin) return null;
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
    const email = authUser?.user?.email;
    if (!email) return null;
    const { data: byEmail } = await supabaseAdmin
      .from('PDC_users')
      .select('departamento')
      .eq('email', email)
      .maybeSingle();
    return byEmail?.departamento?.trim() || null;
  },

  /**
   * Retorna permissões por departamento e o departamento atrelado ao usuário (PDC_users.departamento).
   * O usuário só vê chamados dos departamentos em que tem permissão; o departamento atrelado deve ter ao menos "view".
   */
  async getByAuthUserId(authUserId) {
    const client = supabaseAdmin || supabase;
    const [permsResult, userResult] = await Promise.all([
      client
        .from('PDC_user_permissions')
        .select('departamento, permissao')
        .eq('auth_user_id', authUserId)
        .order('departamento'),
      (supabaseAdmin || supabase)
        .from('PDC_users')
        .select('departamento')
        .eq('auth_user_id', authUserId)
        .maybeSingle(),
    ]);

    const { data: permsData, error } = permsResult;
    if (error) throw new Error(error.message);
    const map = {};
    (permsData || []).forEach((row) => {
      map[row.departamento] = row.permissao;
    });
    const userDepartamento = userResult?.data?.departamento?.trim() || null;
    return { permissions: map, userDepartamento };
  },

  /**
   * Atualiza permissões e opcionalmente o departamento atrelado ao usuário.
   * body: { departamentos: { [departamento]: 'view' | 'view_edit' }, userDepartamento?: string }
   * Se userDepartamento for informado, atualiza PDC_users.departamento e garante que esse departamento tenha ao menos "view" nas permissões.
   */
  async setForAuthUser(authUserId, departamentos, userDepartamento = null) {
    if (!authUserId) throw new Error('auth_user_id é obrigatório');
    if (!supabaseAdmin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY é necessária para salvar permissões (RLS na tabela PDC_user_permissions).');
    }

    const deptTrimmed = userDepartamento?.trim() || null;

    if (deptTrimmed) {
      const payload = { departamento: deptTrimmed, updated_at: new Date().toISOString() };
      const { data: updatedRows, error: updateUserErr } = await supabaseAdmin
        .from('PDC_users')
        .update(payload)
        .eq('auth_user_id', authUserId)
        .select('id');
      if (updateUserErr) throw new Error(`Erro ao atualizar departamento do usuário: ${updateUserErr.message}`);
      if (!updatedRows?.length) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        const email = authUser?.user?.email;
        if (email) {
          const { data: byEmail } = await supabaseAdmin
            .from('PDC_users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          if (byEmail) {
            await supabaseAdmin
              .from('PDC_users')
              .update({
                auth_user_id: authUserId,
                departamento: deptTrimmed,
                nome: authUser.user.user_metadata?.nome || authUser.user.user_metadata?.full_name || email.split('@')[0] || '',
                updated_at: new Date().toISOString(),
              })
              .eq('id', byEmail.id)
              .select();
          } else {
            const { data: role } = await supabaseAdmin.from('PDC_roles').select('id').eq('nome', 'usuario').single();
            await supabaseAdmin
              .from('PDC_users')
              .insert({
                auth_user_id: authUserId,
                email,
                nome: authUser.user.user_metadata?.nome || authUser.user.user_metadata?.full_name || email.split('@')[0] || 'Usuário',
                departamento: deptTrimmed,
                role_id: role?.id,
              })
              .select();
          }
        }
      }
      if (!departamentos || !PERMISSAO_VALIDAS.includes(departamentos[deptTrimmed])) {
        departamentos = { ...(departamentos || {}), [deptTrimmed]: 'view' };
      }
    }

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

    const { error: deleteErr } = await supabaseAdmin
      .from('PDC_user_permissions')
      .delete()
      .eq('auth_user_id', authUserId);

    if (deleteErr) throw new Error(deleteErr.message);

    if (rows.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('PDC_user_permissions')
        .upsert(rows, { onConflict: 'auth_user_id,departamento' });

      if (insertErr) throw new Error(insertErr.message);
    }

    return this.getByAuthUserId(authUserId);
  },

  /**
   * Atualiza apenas o departamento atrelado ao usuário (sem alterar as demais permissões).
   * Garante que esse departamento tenha ao menos "view" em PDC_user_permissions.
   */
  async setUserDepartamento(authUserId, userDepartamento) {
    if (!authUserId) throw new Error('auth_user_id é obrigatório');
    if (!supabaseAdmin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY é necessária para atualizar o departamento do usuário.');
    }
    const deptTrimmed = userDepartamento?.trim() || null;

    if (deptTrimmed) {
      const payload = { departamento: deptTrimmed, updated_at: new Date().toISOString() };
      const { data: updatedRows, error: updateUserErr } = await supabaseAdmin
        .from('PDC_users')
        .update(payload)
        .eq('auth_user_id', authUserId)
        .select('id');
      if (updateUserErr) throw new Error(`Erro ao atualizar departamento do usuário: ${updateUserErr.message}`);
      if (!updatedRows?.length) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        const email = authUser?.user?.email;
        if (email) {
          const { data: byEmail } = await supabaseAdmin
            .from('PDC_users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          if (byEmail) {
            await supabaseAdmin
              .from('PDC_users')
              .update({
                auth_user_id: authUserId,
                departamento: deptTrimmed,
                nome: authUser.user.user_metadata?.nome || authUser.user.user_metadata?.full_name || email.split('@')[0] || '',
                updated_at: new Date().toISOString(),
              })
              .eq('id', byEmail.id)
              .select();
          } else {
            const { data: role } = await supabaseAdmin.from('PDC_roles').select('id').eq('nome', 'usuario').single();
            await supabaseAdmin
              .from('PDC_users')
              .insert({
                auth_user_id: authUserId,
                email,
                nome: authUser.user.user_metadata?.nome || authUser.user.user_metadata?.full_name || email.split('@')[0] || 'Usuário',
                departamento: deptTrimmed,
                role_id: role?.id,
              })
              .select();
          }
        }
      }
      await supabaseAdmin
        .from('PDC_user_permissions')
        .upsert(
          { auth_user_id: authUserId, departamento: deptTrimmed, permissao: 'view', updated_at: new Date().toISOString() },
          { onConflict: 'auth_user_id,departamento' }
        );
    } else {
      const { error: updateUserErr } = await supabaseAdmin
        .from('PDC_users')
        .update({ departamento: null, updated_at: new Date().toISOString() })
        .eq('auth_user_id', authUserId);
      if (updateUserErr) throw new Error(`Erro ao atualizar departamento do usuário: ${updateUserErr.message}`);
    }

    return { userDepartamento: deptTrimmed };
  },
};
