// Configuração do Supabase (preparado para integração futura)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Por enquanto, retorna null se as variáveis não estiverem configuradas
// Isso permite que o sistema funcione sem Supabase inicialmente
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase configurado');
} else {
  console.log('⚠️ Supabase não configurado - usando armazenamento em memória');
}

export default supabase;
