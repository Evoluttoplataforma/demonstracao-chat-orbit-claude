ALTER TABLE public.diagnostic_responses
  ADD COLUMN IF NOT EXISTS lead_celular text,
  ADD COLUMN IF NOT EXISTS lead_empresa text;