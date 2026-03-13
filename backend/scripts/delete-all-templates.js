/**
 * Script one-off: apaga todos os templates (PDC_templates).
 * Uso: node scripts/delete-all-templates.js (a partir da pasta backend)
 * Requer: .env.local na raiz com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
dotenv.config({ path: join(root, '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

async function main() {
  const client = supabaseAdmin;
  if (!client) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY (e SUPABASE_URL) não configuradas. Configure .env.local na raiz.');
    process.exit(1);
  }

  try {
    const { data: templates, error: selectErr } = await client.from('PDC_templates').select('id, departamento');
    if (selectErr) {
      console.error('Erro ao listar templates:', selectErr.message);
      process.exit(1);
    }
    const ids = (templates || []).map((t) => t.id);
    if (ids.length === 0) {
      console.log('✅ Nenhum template encontrado. Nada a apagar.');
      return;
    }

    const { error: deleteErr } = await client.from('PDC_templates').delete().in('id', ids);
    if (deleteErr) {
      console.error('Erro ao apagar templates:', deleteErr.message);
      process.exit(1);
    }

    console.log(`✅ ${ids.length} template(s) apagado(s) com sucesso.`);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

main();
