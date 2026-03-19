-- Atribuição de responsável no chamado.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PDC_tickets'
      AND column_name = 'responsavel_id'
  ) THEN
    ALTER TABLE public."PDC_tickets"
      ADD COLUMN responsavel_id uuid NULL REFERENCES public."PDC_users"(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pdc_tickets_responsavel_id
  ON public."PDC_tickets"(responsavel_id);
