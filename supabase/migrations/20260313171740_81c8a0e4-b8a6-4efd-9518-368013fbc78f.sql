ALTER TABLE public.salas ADD COLUMN categoria text NOT NULL DEFAULT 'onboarding';

COMMENT ON COLUMN public.salas.categoria IS 'Category: onboarding or tira-duvidas';