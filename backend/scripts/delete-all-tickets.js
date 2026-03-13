/**
 * Script one-off: apaga todos os chamados (e respostas) para testes.
 * Uso: node backend/scripts/delete-all-tickets.js
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
    // Notificações podem referenciar ticket_id; remover primeiro se a tabela existir
    const { error: notifErr } = await client.from('PDC_notifications').delete().not('ticket_id', 'is', null);
    if (notifErr) {
      // Tabela pode não existir ou coluna diferente; seguir
      console.log('ℹ PDC_notifications:', notifErr.message || 'ignorado');
    }

    // Respostas são apagadas em cascata ao apagar tickets; apagar tickets
    const { data: tickets, error: selectErr } = await client.from('PDC_tickets').select('id');
    if (selectErr) {
      console.error('Erro ao listar chamados:', selectErr.message);
      process.exit(1);
    }
    const ids = (tickets || []).map((t) => t.id);
    if (ids.length === 0) {
      console.log('✅ Nenhum chamado encontrado. Nada a apagar.');
      return;
    }

    // Apagar em lotes (ex.: 100) para evitar limite da URL
    const BATCH = 100;
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      const { error: deleteErr } = await client.from('PDC_tickets').delete().in('id', batch);
      if (deleteErr) {
        console.error('Erro ao apagar chamados:', deleteErr.message);
        process.exit(1);
      }
    }

    console.log(`✅ ${ids.length} chamado(s) apagado(s) com sucesso. Respostas foram removidas em cascata.`);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

main();
