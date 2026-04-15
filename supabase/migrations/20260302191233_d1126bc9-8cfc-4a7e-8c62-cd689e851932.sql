
-- Make data_reuniao and horario_reuniao nullable for partial leads
ALTER TABLE public.leads ALTER COLUMN data_reuniao DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN data_reuniao SET DEFAULT '';
ALTER TABLE public.leads ALTER COLUMN horario_reuniao DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN horario_reuniao SET DEFAULT '';

-- Add pipedrive IDs to track created resources for updates
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipedrive_person_id integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipedrive_org_id integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipedrive_deal_id integer;

-- Add status column to distinguish partial vs complete leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'parcial';
