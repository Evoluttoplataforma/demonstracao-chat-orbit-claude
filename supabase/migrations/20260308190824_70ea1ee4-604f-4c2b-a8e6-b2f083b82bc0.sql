
UPDATE public.leads
SET copy_variant = (ARRAY['A','B','C','D','E'])[1 + floor(random() * 5)::int]
WHERE copy_variant IS NULL OR copy_variant = '';
