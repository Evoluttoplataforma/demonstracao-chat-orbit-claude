
-- 1. Add UTM and tracking columns to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gclid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fbclid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gbraid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS wbraid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ttclid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gad_campaignid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gad_source text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS msclkid text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS li_fat_id text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sck text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS landing_page text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origin_page text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_attributes_encoded text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS apex_session_id text;

-- 2. Fix RLS — drop all existing RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

CREATE POLICY "Anyone can insert leads" ON public.leads AS PERMISSIVE
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update leads" ON public.leads AS PERMISSIVE
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Authenticated users can read leads" ON public.leads AS PERMISSIVE
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete leads" ON public.leads AS PERMISSIVE
  FOR DELETE TO authenticated USING (true);

-- 3. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
