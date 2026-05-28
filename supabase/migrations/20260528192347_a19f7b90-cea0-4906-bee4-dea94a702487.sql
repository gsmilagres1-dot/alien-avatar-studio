-- PASSPORTS
CREATE TABLE public.passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  passport_number text NOT NULL UNIQUE,
  origin_planet text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  payment_id uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.passports TO authenticated;
GRANT ALL ON public.passports TO service_role;
ALTER TABLE public.passports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own passport select" ON public.passports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own passport insert" ON public.passports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own passport update" ON public.passports FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER passports_touch BEFORE UPDATE ON public.passports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- VISAS
CREATE TABLE public.visas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  destination_id text NOT NULL,
  destination_name text NOT NULL,
  transport text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payment_id uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (user_id, destination_id)
);
GRANT SELECT, INSERT ON public.visas TO authenticated;
GRANT ALL ON public.visas TO service_role;
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own visa select" ON public.visas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own visa insert" ON public.visas FOR INSERT WITH CHECK (auth.uid() = user_id);

-- QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 5),
  score integer NOT NULL,
  total integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  questions jsonb,
  answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quiz select" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own quiz insert" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_quiz_user_level ON public.quiz_attempts(user_id, level);

-- Extend payment_transactions kind
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'identity';