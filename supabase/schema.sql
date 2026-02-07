-- Portal de Chamados - Schema Supabase
-- Todas as tabelas no schema public com prefixo PDC_
-- Execute no Supabase Dashboard > SQL Editor

-- =============================================
-- 1. DROP (ordem inversa respeitando FKs)
-- =============================================
DROP TABLE IF EXISTS public."PDC_kb_articles" CASCADE;
DROP TABLE IF EXISTS public."PDC_kb_categories" CASCADE;
DROP TABLE IF EXISTS public."PDC_ticket_responses" CASCADE;
DROP TABLE IF EXISTS public."PDC_tickets" CASCADE;
DROP TABLE IF EXISTS public."PDC_templates" CASCADE;
DROP TABLE IF EXISTS public."PDC_users" CASCADE;
DROP TABLE IF EXISTS public."PDC_roles" CASCADE;

-- =============================================
-- 2. CREATE TABLES
-- =============================================

-- PDC_roles - Perfis de acesso
CREATE TABLE public."PDC_roles" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  nivel integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PDC_users - Usuários do sistema
CREATE TABLE public."PDC_users" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  setor text,
  departamento text,
  ramal text,
  role_id uuid REFERENCES public."PDC_roles"(id),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDC_tickets - Chamados
CREATE TABLE public."PDC_tickets" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_protocolo text UNIQUE NOT NULL,
  solicitante_id uuid REFERENCES public."PDC_users"(id),
  area_destino text,
  setor text,
  assunto text,
  mensagem text,
  tipo_suporte text,
  dados_extras jsonb DEFAULT '{}',
  status text DEFAULT 'Aberto',
  prioridade text DEFAULT 'Normal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- PDC_ticket_responses - Respostas dos chamados
CREATE TABLE public."PDC_ticket_responses" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public."PDC_tickets"(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public."PDC_users"(id),
  mensagem text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PDC_templates - Templates dinâmicos por departamento
CREATE TABLE public."PDC_templates" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento text UNIQUE NOT NULL,
  fields jsonb DEFAULT '[]',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDC_kb_categories - Categorias da base de conhecimento
CREATE TABLE public."PDC_kb_categories" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  icone text DEFAULT 'folder',
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDC_kb_articles - Artigos da base de conhecimento
CREATE TABLE public."PDC_kb_articles" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL REFERENCES public."PDC_kb_categories"(id),
  titulo text NOT NULL,
  conteudo text,
  autor_id uuid REFERENCES public."PDC_users"(id),
  publicado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. ÍNDICES ÚTEIS
-- =============================================
CREATE INDEX idx_pdc_tickets_created_at ON public."PDC_tickets"(created_at DESC);
CREATE INDEX idx_pdc_tickets_status ON public."PDC_tickets"(status);
CREATE INDEX idx_pdc_tickets_area_destino ON public."PDC_tickets"(area_destino);
CREATE INDEX idx_pdc_tickets_solicitante_id ON public."PDC_tickets"(solicitante_id);
CREATE INDEX idx_pdc_ticket_responses_ticket_id ON public."PDC_ticket_responses"(ticket_id);
CREATE INDEX idx_pdc_users_email ON public."PDC_users"(email);
CREATE INDEX idx_pdc_kb_articles_categoria_id ON public."PDC_kb_articles"(categoria_id);

-- =============================================
-- 4. DADOS INICIAIS - ROLES
-- =============================================
INSERT INTO public."PDC_roles" (nome, descricao, nivel) VALUES
  ('admin', 'Administrador - acesso total ao sistema', 4),
  ('gestor_area', 'Gestor de Área - gerencia departamento', 3),
  ('tecnico', 'Técnico/Suporte - atende chamados', 2),
  ('usuario', 'Usuário - abre chamados', 1);

-- =============================================
-- RLS: Desabilitado para uso via service_role
-- Se usar anon key, habilite RLS e crie políticas
-- =============================================
ALTER TABLE public."PDC_roles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PDC_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PDC_tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PDC_ticket_responses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PDC_templates" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PDC_kb_categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PDC_kb_articles" DISABLE ROW LEVEL SECURITY;
