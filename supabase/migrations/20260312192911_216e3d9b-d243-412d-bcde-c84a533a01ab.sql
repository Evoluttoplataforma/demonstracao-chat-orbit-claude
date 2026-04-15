CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  resend_id text,
  success boolean NOT NULL DEFAULT true,
  error_message text
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read email_logs" ON public.email_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert email_logs" ON public.email_logs
  FOR INSERT TO authenticated, anon WITH CHECK (true);