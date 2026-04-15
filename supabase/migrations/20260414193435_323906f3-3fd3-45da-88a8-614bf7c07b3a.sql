
-- Update trigger function to fire for ALL leads (plataforma needs all, Make only fbclid)
CREATE OR REPLACE FUNCTION public.notify_make_on_lead_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://nmeuxanxjnhpdcfkdrdc.supabase.co/functions/v1/sync-lead-make',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZXV4YW54am5ocGRjZmtkcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzIyNjEsImV4cCI6MjA4NzcwODI2MX0.fFWkVyp-Ul1r4K-UpZtoBPpFXGPu1JsD6CBjzSs31c4"}'::jsonb,
    body := jsonb_build_object('lead_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
