CREATE POLICY "Anon can read leads by email"
ON public.leads
FOR SELECT
TO anon
USING (true);