
-- Drop all RESTRICTIVE policies on leads and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Anyone can insert leads" ON public.leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (true);
