CREATE OR REPLACE FUNCTION public.digits_only(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT regexp_replace($1, '\D', '', 'g') $$;