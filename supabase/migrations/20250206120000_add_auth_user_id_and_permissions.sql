-- auth_user_id em PDC_users (vínculo com Supabase Auth) e tabela PDC_user_permissions
-- Execute no Supabase SQL Editor se ainda não existir.

-- Coluna auth_user_id em PDC_users (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'PDC_users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public."PDC_users" ADD COLUMN auth_user_id uuid UNIQUE;
  END IF;
END $$;

-- Tabela PDC_user_permissions (se não existir)
CREATE TABLE IF NOT EXISTS public."PDC_user_permissions" (
  auth_user_id uuid NOT NULL,
  departamento text NOT NULL,
  permissao text NOT NULL CHECK (permissao IN ('view', 'view_edit')),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (auth_user_id, departamento)
);

ALTER TABLE public."PDC_user_permissions" DISABLE ROW LEVEL SECURITY;
