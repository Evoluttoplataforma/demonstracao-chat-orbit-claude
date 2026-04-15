
-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function that calls sync-lead-make edge function
CREATE OR REPLACE FUNCTION public.notify_make_on_lead_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text := current_setting('app.settings.supabase_url', true);
  _service_key text := current_setting('app.settings.service_role_key', true);
BEGIN
  -- Only fire for leads with fbclid (Meta Ads)
  IF NEW.fbclid IS NOT NULL AND NEW.fbclid <> '' THEN
    PERFORM extensions.http_post(
      url := concat(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1),
        '/functions/v1/sync-lead-make'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1))
      ),
      body := jsonb_build_object('lead_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on INSERT and UPDATE
CREATE TRIGGER trg_sync_lead_make
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_make_on_lead_change();
