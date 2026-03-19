-- Permissões de manipulação de templates por departamento (separadas de PDC_user_permissions).
CREATE TABLE IF NOT EXISTS public."PDC_user_template_permissions" (
  auth_user_id uuid NOT NULL,
  departamento text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (auth_user_id, departamento)
);

ALTER TABLE public."PDC_user_template_permissions" DISABLE ROW LEVEL SECURITY;
