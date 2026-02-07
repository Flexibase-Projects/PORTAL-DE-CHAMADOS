import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega .env.local da raiz do projeto
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config();

// Suporta SUPABASE_* ou VITE_SUPABASE_* (quando .env.local usa nomes do frontend)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL/SUPABASE_KEY ou VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY são obrigatórios no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase conectado');

export default supabase;
