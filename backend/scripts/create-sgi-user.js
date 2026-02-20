/**
 * Script one-off: cria um usuário no Supabase Auth e concede permissão de acesso ao SGI.
 * Uso: node backend/scripts/create-sgi-user.js
 * Requer: .env.local na raiz com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (e SUPABASE_JWT_SECRET se usar sb_secret_).
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';
import { permissionService } from '../src/services/permissionService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
dotenv.config({ path: join(root, '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

const EMAIL = 'luiz2506spike@gmail.com';
const PASSWORD = '123456';
const DEPARTAMENTO_SGI = 'SGI';
const PERMISSAO_SGI = 'view_edit';

async function main() {
  if (!supabaseAdmin) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY (e SUPABASE_URL) não configuradas. Configure .env.local na raiz.');
    process.exit(1);
  }

  console.log('🔐 Criando usuário no Supabase Auth...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { nome: 'Luiz (SGI)' },
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log('⚠️ Usuário já existe no Auth. Aplicando apenas permissão SGI...');
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = (users || []).find((u) => u.email === EMAIL);
      if (!existing) {
        console.error('❌ Não foi possível localizar o usuário existente.');
        process.exit(1);
      }
      await grantSgiPermission(existing.id);
      console.log('✅ Permissão SGI atribuída ao usuário existente:', EMAIL);
      return;
    }
    console.error('❌ Erro ao criar usuário:', authError.message);
    process.exit(1);
  }

  const userId = authData?.user?.id;
  if (!userId) {
    console.error('❌ Resposta do Auth sem user.id');
    process.exit(1);
  }

  console.log('✅ Usuário criado no Auth:', EMAIL, '(id:', userId, ')');
  await grantSgiPermission(userId);
  console.log('✅ Permissão de acesso ao SGI atribuída (departamento:', DEPARTAMENTO_SGI + ',', PERMISSAO_SGI + ')');
}

async function grantSgiPermission(authUserId) {
  const departamentos = { [DEPARTAMENTO_SGI]: PERMISSAO_SGI };
  await permissionService.setForAuthUser(authUserId, departamentos);
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
