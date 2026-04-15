
-- Drop old function and trigger
DROP TRIGGER IF EXISTS trg_sync_lead_make ON public.leads;
DROP FUNCTION IF EXISTS public.notify_make_on_lead_change();

-- Recreate with pg_net direct call
CREATE OR REPLACE FUNCTION public.notify_make_on_lead_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire for leads with fbclid (Meta Ads)
  IF NEW.fbclid IS NOT NULL AND NEW.fbclid <> '' THEN
    PERFORM net.http_post(
      url := 'https://nmeuxanxjnhpdcfkdrdc.supabase.co/functions/v1/sync-lead-make',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZXV4YW54am5ocGRjZmtkcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzIyNjEsImV4cCI6MjA4NzcwODI2MX0.fFWkVyp-Ul1r4K-UpZtoBPpFXGPu1JsD6CBjzSs31c4"}'::jsonb,
      body := jsonb_build_object('lead_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_lead_make
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_make_on_lead_change();
