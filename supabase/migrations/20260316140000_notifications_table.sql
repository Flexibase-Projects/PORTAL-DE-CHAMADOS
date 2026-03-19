-- Tabela de notificações (ex.: nova resposta no chamado)
CREATE TABLE IF NOT EXISTS public."PDC_notifications" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  tipo text NOT NULL,
  ticket_id uuid REFERENCES public."PDC_tickets"(id) ON DELETE CASCADE,
  titulo text,
  mensagem text,
  lida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdc_notifications_auth_user_id ON public."PDC_notifications"(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_pdc_notifications_ticket_id ON public."PDC_notifications"(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pdc_notifications_lida ON public."PDC_notifications"(auth_user_id, lida);

ALTER TABLE public."PDC_notifications" DISABLE ROW LEVEL SECURITY;
