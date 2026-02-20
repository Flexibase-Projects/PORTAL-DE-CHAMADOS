import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Garantir que .env.local da raiz seja carregado (mesmo se este módulo for carregado antes de supabase.js)
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const projectRef = process.env.SUPABASE_PROJECT_REF || 'default';
const jwtIss = process.env.SUPABASE_JWT_ISS || 'supabase-demo'; // local CLI usa "supabase-demo"

/**
 * O Auth (GoTrue) exige um JWT no header Bearer. A chave "sb_secret_..." não é um JWT.
 * Se a chave começar com sb_secret_ e SUPABASE_JWT_SECRET estiver definido, geramos um JWT service_role.
 */
function resolveServiceRoleKey() {
  if (!serviceRoleKey) return null;
  // JWT começa com eyJ
  if (serviceRoleKey.startsWith('eyJ')) return serviceRoleKey;
  if (serviceRoleKey.startsWith('sb_secret_') && jwtSecret) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: jwtIss,
      ref: projectRef,
      role: 'service_role',
      iat: now,
      exp: now + 3600,
    };
    return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
  }
  return serviceRoleKey;
}

const bearerKey = resolveServiceRoleKey();

/**
 * Cliente Supabase com service_role (apenas backend).
 * Usado para listar usuários do Auth (admin). Não exponha esta chave no frontend.
 */
export const supabaseAdmin = bearerKey && supabaseUrl
  ? createClient(supabaseUrl, bearerKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

if (!serviceRoleKey && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não definida. Listagem de usuários do Auth no admin ficará indisponível.');
}
if (serviceRoleKey?.startsWith('sb_secret_') && !jwtSecret && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ Chave sb_secret_ exige SUPABASE_JWT_SECRET para o Auth admin. Defina SUPABASE_JWT_SECRET no .env.local (valor em "JWT secret" do supabase status).');
}
