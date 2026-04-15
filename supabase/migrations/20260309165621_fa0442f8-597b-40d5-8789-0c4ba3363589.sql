CREATE OR REPLACE FUNCTION public.find_lead_by_phone(phone_digits text)
RETURNS SETOF leads
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM leads
  WHERE length(digits_only(whatsapp)) >= 8
    AND (
      digits_only(whatsapp) LIKE '%' || phone_digits || '%'
      OR phone_digits LIKE '%' || digits_only(whatsapp) || '%'
    )
  ORDER BY created_at DESC
  LIMIT 1
$$;