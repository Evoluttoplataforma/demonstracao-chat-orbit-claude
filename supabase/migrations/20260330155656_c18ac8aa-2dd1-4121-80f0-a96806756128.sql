CREATE TABLE public.roleta_counter (
  id integer PRIMARY KEY DEFAULT 1,
  current_index integer NOT NULL DEFAULT 0
);
INSERT INTO public.roleta_counter (id, current_index) VALUES (1, 0);
ALTER TABLE public.roleta_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can read roleta" ON public.roleta_counter FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service can update roleta" ON public.roleta_counter FOR UPDATE TO anon, authenticated USING (true);