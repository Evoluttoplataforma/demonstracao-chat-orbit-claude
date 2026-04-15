
CREATE OR REPLACE FUNCTION public.assign_copy_variant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  variants text[] := ARRAY['A','B','C','D','E'];
BEGIN
  IF NEW.copy_variant IS NULL OR NEW.copy_variant = '' THEN
    NEW.copy_variant := variants[1 + floor(random() * 5)::int];
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_copy_variant
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_copy_variant();
