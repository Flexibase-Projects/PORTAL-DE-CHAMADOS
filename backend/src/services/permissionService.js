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
      const emails = (users || []).map((u) => u.email).filter(Boolean);
      const emailToAuthId = (users || []).reduce((acc, u) => {
        if (u.email) acc[u.email] = u.id;
        return acc;
      }, {});
      let departamentoByAuthId = {};
      const BATCH = 150; // evita limite do PostgREST em .in()
      if (ids.length > 0) {
        const allPdcRows = [];
        for (let i = 0; i < ids.length; i += BATCH) {
          const batch = ids.slice(i, i + BATCH);
          const { data: pdcRows, error: pdcErr } = await supabaseAdmin
            .from('PDC_users')
            .select('auth_user_id, departamento')
            .in('auth_user_id', batch);
          if (pdcErr) throw new Error(`PDC_users (auth_user_id): ${pdcErr.message}`);
          if (pdcRows?.length) allPdcRows.push(...pdcRows);
        }
        departamentoByAuthId = (allPdcRows || []).reduce((acc, r) => {
          if (r.auth_user_id && r.departamento?.trim()) acc[r.auth_user_id] = r.departamento.trim();
          return acc;
        }, {});
        // Também preencher por email: linhas em PDC_users com email do Auth mas auth_user_id null não entram na query acima
        if (emails.length > 0) {
          for (let i = 0; i < emails.length; i += BATCH) {
            const emailBatch = emails.slice(i, i + BATCH);
            const { data: pdcByEmail, error: emailErr } = await supabaseAdmin
              .from('PDC_users')
              .select('email, departamento')
              .in('email', emailBatch);
            if (emailErr) throw new Error(`PDC_users (email): ${emailErr.message}`);
            (pdcByEmail || []).forEach((r) => {
              const authId = emailToAuthId[r.email];
              if (authId && r.departamento?.trim() && !departamentoByAuthId[authId])
                departamentoByAuthId[authId] = r.departamento.trim();
            });
          }
        }
      }
      const result = (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome || u.user_metadata?.full_name || u.email?.split('@')[0] || '—',
        created_at: u.created_at,
        departamento: departamentoByAuthId[u.id] || null,
      }));
      return result;
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
    const [permsResult, templatePermsResult, userResult] = await Promise.all([
      client
        .from('PDC_user_permissions')
        .select('departamento, permissao')
        .eq('auth_user_id', authUserId)
        .order('departamento'),
      client
        .from('PDC_user_template_permissions')
        .select('departamento')
        .eq('auth_user_id', authUserId),
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
    const templateData = templatePermsResult?.error ? [] : (templatePermsResult?.data || []);
    const templateDepartamentos = (templateData || [])
      .map((row) => row.departamento)
      .filter((d) => typeof d === 'string' && d.trim().length > 0)
      .map((d) => d.trim());
    templateDepartamentos.forEach((dept) => {
      // Mantém compatibilidade com front antigo que lê manage_templates no mapa.
      const row = { departamento: dept };
      if (!map[row.departamento]) map[row.departamento] = 'manage_templates';
    });
    const userDepartamento = userResult?.data?.departamento?.trim() || null;
    return { permissions: map, userDepartamento, templateDepartamentos };
  },

  /**
   * Atualiza permissões e opcionalmente o departamento atrelado ao usuário.
   * body: { departamentos: { [departamento]: 'view' | 'view_edit' | 'manage_templates' }, userDepartamento?: string }
   * Se userDepartamento for informado, atualiza PDC_users.departamento e garante que esse departamento tenha ao menos "view" nas permissões.
   */
  async setForAuthUser(authUserId, departamentos, userDepartamento = null, templateDepartamentos = []) {
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
                setor: '',
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
                setor: '',
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
      if (!departamento?.trim()) continue;
      if (!PERMISSAO_VALIDAS.includes(permissao)) continue;
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

    const templateDeleteResult = await supabaseAdmin
      .from('PDC_user_template_permissions')
      .delete()
      .eq('auth_user_id', authUserId);
    const normalizedTemplateDepts = [...new Set(
      (templateDepartamentos || [])
        .map((d) => (typeof d === 'string' ? d.trim() : ''))
        .filter(Boolean)
    )];

    if (templateDeleteResult.error && normalizedTemplateDepts.length > 0) {
      throw new Error(
        `Permissão de templates requer tabela PDC_user_template_permissions. ` +
        `Rode a migration pendente. Detalhe: ${templateDeleteResult.error.message}`
      );
    }

    if (rows.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('PDC_user_permissions')
        .upsert(rows, { onConflict: 'auth_user_id,departamento' });

      if (insertErr) throw new Error(insertErr.message);
    }

    if (normalizedTemplateDepts.length > 0) {
      const templateRows = normalizedTemplateDepts.map((departamento) => ({
        auth_user_id: authUserId,
        departamento,
        updated_at: new Date().toISOString(),
      }));
      const { error: templateInsertErr } = await supabaseAdmin
        .from('PDC_user_template_permissions')
        .upsert(templateRows, { onConflict: 'auth_user_id,departamento' });
      if (templateInsertErr) {
        throw new Error(
          `Erro ao salvar permissão de templates. ` +
          `Verifique se a migration foi aplicada. Detalhe: ${templateInsertErr.message}`
        );
      }
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
            const { error: updateByEmailErr } = await supabaseAdmin
              .from('PDC_users')
              .update({
                auth_user_id: authUserId,
                departamento: deptTrimmed,
                nome: authUser.user.user_metadata?.nome || authUser.user.user_metadata?.full_name || email.split('@')[0] || '',
                setor: '', // NOT NULL no banco; manter '' se já existir
                updated_at: new Date().toISOString(),
              })
              .eq('id', byEmail.id)
              .select();
            if (updateByEmailErr) throw new Error(`Erro ao atualizar departamento (por email): ${updateByEmailErr.message}`);
          } else {
            const { data: role } = await supabaseAdmin.from('PDC_roles').select('id').eq('nome', 'usuario').single();
            const { error: insertErr } = await supabaseAdmin
              .from('PDC_users')
              .insert({
                auth_user_id: authUserId,
                email,
                nome: authUser.user.user_metadata?.nome || authUser.user.user_metadata?.full_name || email.split('@')[0] || 'Usuário',
                departamento: deptTrimmed,
                setor: '', // NOT NULL no banco; '' para não violar constraint
                role_id: role?.id,
              })
              .select();
            if (insertErr) throw new Error(`Erro ao criar usuário em PDC_users: ${insertErr.message}`);
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
      // Coluna departamento em PDC_users é NOT NULL; usar '' para "sem departamento"
      const { error: updateUserErr } = await supabaseAdmin
        .from('PDC_users')
        .update({ departamento: '', updated_at: new Date().toISOString() })
        .eq('auth_user_id', authUserId);
      if (updateUserErr) throw new Error(`Erro ao atualizar departamento do usuário: ${updateUserErr.message}`);
    }

    return { userDepartamento: deptTrimmed };
  },
};
