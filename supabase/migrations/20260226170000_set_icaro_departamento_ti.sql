-- Define o usuário icarofranca12345@gmail.com no departamento TI
-- auth_user_id do Supabase Auth: 31e344e3-55bf-41e8-be0a-04767c79fa82

-- Atualiza se já existir registro por email ou auth_user_id
UPDATE public."PDC_users"
SET departamento = 'TI', updated_at = now()
WHERE email = 'icarofranca12345@gmail.com'
   OR auth_user_id = '31e344e3-55bf-41e8-be0a-04767c79fa82';

-- Se não existir nenhuma linha, insere (após login o sync pode ter criado só por auth_user_id; aqui cobrimos por email)
INSERT INTO public."PDC_users" (auth_user_id, email, nome, departamento, role_id, created_at, updated_at)
SELECT
  '31e344e3-55bf-41e8-be0a-04767c79fa82',
  'icarofranca12345@gmail.com',
  'icaro',
  'TI',
  (SELECT id FROM public."PDC_roles" WHERE nome = 'usuario' LIMIT 1),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public."PDC_users"
  WHERE email = 'icarofranca12345@gmail.com'
     OR auth_user_id = '31e344e3-55bf-41e8-be0a-04767c79fa82'
);
