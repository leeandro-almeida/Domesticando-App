-- ============================================================
-- DOMESTICANDO — Schema completo
-- Cole no SQL Editor do Supabase e execute
-- ============================================================


-- ------------------------------------------------------------
-- 1. PROFILES
-- Criado automaticamente quando o usuário se registra
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas o próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza apenas o próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- ------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color      TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia apenas suas categorias"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 3. TRANSACTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia apenas suas transações"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 4. TRIGGER — cria perfil automaticamente no cadastro
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------
-- 5. TASK_TEMPLATES
-- Tarefas fixas definidas pelo admin por grau de lesão
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade                 TEXT NOT NULL CHECK (grade IN ('A', 'B', 'D', 'E')),
  name                  TEXT NOT NULL,
  recurrence            TEXT NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'today')),
  days_of_week          INT[] NOT NULL DEFAULT '{}',
  has_steps             BOOLEAN NOT NULL DEFAULT FALSE,
  steps_count           INT CHECK (steps_count BETWEEN 1 AND 6),
  step_interval_minutes INT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos autenticados leem tarefas do seu grau"
  ON public.task_templates FOR SELECT
  TO authenticated
  USING (TRUE);

-- Mutações feitas via service_role na Edge Function admin-tasks


-- ------------------------------------------------------------
-- 6. CATEGORIAS PADRÃO (inseridas após o primeiro login via trigger)
-- Opcional: rode manualmente com seu user_id para testar
-- ------------------------------------------------------------
-- Substitua <SEU-USER-ID> pelo UUID do seu usuário no Supabase Auth
/*
INSERT INTO public.categories (user_id, name, type, color) VALUES
  ('<SEU-USER-ID>', 'Salário',       'income',  '#22c55e'),
  ('<SEU-USER-ID>', 'Freelance',     'income',  '#10b981'),
  ('<SEU-USER-ID>', 'Alimentação',   'expense', '#ef4444'),
  ('<SEU-USER-ID>', 'Moradia',       'expense', '#f97316'),
  ('<SEU-USER-ID>', 'Transporte',    'expense', '#f59e0b'),
  ('<SEU-USER-ID>', 'Saúde',         'expense', '#3b82f6'),
  ('<SEU-USER-ID>', 'Lazer',         'expense', '#8b5cf6'),
  ('<SEU-USER-ID>', 'Educação',      'expense', '#06b6d4'),
  ('<SEU-USER-ID>', 'Outros',        'expense', '#6b7280');
*/
