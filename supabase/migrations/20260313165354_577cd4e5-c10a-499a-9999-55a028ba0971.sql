-- Rooms table
CREATE TABLE public.salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text DEFAULT '',
  link_sala text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active salas" ON public.salas
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can insert salas" ON public.salas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update salas" ON public.salas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete salas" ON public.salas
  FOR DELETE TO authenticated USING (true);

-- Schedules table (recurring + specific dates)
CREATE TABLE public.sala_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'recorrente', -- 'recorrente' or 'especifico'
  dia_semana integer, -- 0=domingo..6=sabado (for recorrente)
  data_especifica date, -- for especifico
  horario time NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sala_horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read horarios" ON public.sala_horarios
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can insert horarios" ON public.sala_horarios
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update horarios" ON public.sala_horarios
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete horarios" ON public.sala_horarios
  FOR DELETE TO authenticated USING (true);

-- Attendance confirmations
CREATE TABLE public.sala_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  horario_id uuid NOT NULL REFERENCES public.sala_horarios(id) ON DELETE CASCADE,
  data_sessao date NOT NULL,
  nome text NOT NULL,
  email text NOT NULL,
  whatsapp text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sala_presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert presencas" ON public.sala_presencas
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read presencas" ON public.sala_presencas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can delete presencas" ON public.sala_presencas
  FOR DELETE TO authenticated USING (true);