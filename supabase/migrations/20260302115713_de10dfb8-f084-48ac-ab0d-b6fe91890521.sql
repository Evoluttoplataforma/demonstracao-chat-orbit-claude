
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sobrenome TEXT DEFAULT '',
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT NOT NULL,
  oque_faz TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  faturamento TEXT DEFAULT '',
  funcionarios TEXT DEFAULT '',
  prioridade TEXT DEFAULT '',
  data_reuniao TEXT NOT NULL,
  horario_reuniao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all leads
CREATE POLICY "Authenticated users can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- Anyone can insert leads (from the public chat form)
CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated users can update leads
CREATE POLICY "Authenticated users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true);

-- Authenticated users can delete leads
CREATE POLICY "Authenticated users can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (true);
