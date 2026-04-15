
-- Create sellers table
CREATE TABLE public.vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage sellers
CREATE POLICY "Authenticated users can read vendedores"
ON public.vendedores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vendedores"
ON public.vendedores FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendedores"
ON public.vendedores FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete vendedores"
ON public.vendedores FOR DELETE TO authenticated USING (true);
