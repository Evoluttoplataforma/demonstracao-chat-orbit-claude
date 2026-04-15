
CREATE TABLE public.diagnostic_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_email text NOT NULL,
  lead_nome text NOT NULL DEFAULT '',
  setor text NOT NULL DEFAULT '',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT NULL,
  score_gestao numeric DEFAULT NULL,
  score_ia numeric DEFAULT NULL,
  score_total numeric DEFAULT NULL,
  maturity_level text DEFAULT NULL,
  ai_summary text DEFAULT NULL,
  meeting_date text DEFAULT NULL,
  meeting_time text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert diagnostic responses"
ON public.diagnostic_responses FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon can select own diagnostic responses"
ON public.diagnostic_responses FOR SELECT TO anon
USING (true);

CREATE POLICY "Authenticated can select diagnostic responses"
ON public.diagnostic_responses FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete diagnostic responses"
ON public.diagnostic_responses FOR DELETE TO authenticated
USING (true);

CREATE POLICY "Anon can update own diagnostic responses"
ON public.diagnostic_responses FOR UPDATE TO anon
USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_responses;
