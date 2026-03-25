-- =============================================================================
-- Execute este arquivo no Supabase: SQL Editor → colar → Run
-- Cria a tabela PDC_ticket_activities (histórico / timeline). Idempotente.
-- Nada disso "apaga" dados; só cria estrutura que faltava no projeto remoto.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public."PDC_ticket_activities" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public."PDC_tickets"(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  autor_id uuid REFERENCES public."PDC_users"(id),
  created_at timestamptz DEFAULT now(),
  detalhes jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pdc_ticket_activities_ticket_id ON public."PDC_ticket_activities"(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pdc_ticket_activities_created_at ON public."PDC_ticket_activities"(ticket_id, created_at DESC);

ALTER TABLE public."PDC_ticket_activities" DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."PDC_ticket_activities" IS 'Registro de atividades no chamado: comentário, alteração de status, etc.';
COMMENT ON COLUMN public."PDC_ticket_activities".tipo IS 'comentario | status_alterado | criado';
COMMENT ON COLUMN public."PDC_ticket_activities".detalhes IS 'Ex: { mensagem?, status_anterior?, status_novo?, response_id? }';

-- No dashboard Supabase: Settings → API → Reload schema (se o PostgREST ainda não enxergar a tabela).
