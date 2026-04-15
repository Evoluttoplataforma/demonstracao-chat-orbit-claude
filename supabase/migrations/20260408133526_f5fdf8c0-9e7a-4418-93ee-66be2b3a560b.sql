CREATE POLICY "Authenticated can insert diagnostic responses"
ON public.diagnostic_responses
FOR INSERT
TO authenticated
WITH CHECK (true);