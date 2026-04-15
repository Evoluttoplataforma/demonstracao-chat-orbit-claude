ALTER TABLE public.diagnostic_responses
ADD COLUMN IF NOT EXISTS sala_id uuid,
ADD COLUMN IF NOT EXISTS sala_nome text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'diagnostic_responses_sala_id_fkey'
  ) THEN
    ALTER TABLE public.diagnostic_responses
    ADD CONSTRAINT diagnostic_responses_sala_id_fkey
    FOREIGN KEY (sala_id)
    REFERENCES public.salas(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_diagnostic_responses_sala_id_created_at
ON public.diagnostic_responses (sala_id, created_at DESC);