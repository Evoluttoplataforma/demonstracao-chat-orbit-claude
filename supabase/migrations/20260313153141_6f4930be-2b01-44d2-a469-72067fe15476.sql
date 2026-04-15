
CREATE TABLE public.manychat_flow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  whatsapp text NOT NULL,
  flow_name text NOT NULL DEFAULT '',
  step_name text NOT NULL DEFAULT '',
  message_preview text,
  raw_payload jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.manychat_flow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read flow logs" ON public.manychat_flow_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service can insert flow logs" ON public.manychat_flow_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_manychat_flow_logs_lead_id ON public.manychat_flow_logs(lead_id);
CREATE INDEX idx_manychat_flow_logs_whatsapp ON public.manychat_flow_logs(whatsapp);
