
-- Carteira de fichas / anéis / alimentos por usuário
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fichas INTEGER NOT NULL DEFAULT 0,
  aneis INTEGER NOT NULL DEFAULT 0,
  alimento_liquido INTEGER NOT NULL DEFAULT 0,
  alimento_salgado INTEGER NOT NULL DEFAULT 0,
  alimento_doce INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own wallet" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own wallet" ON public.wallets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER wallets_touch BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Log de transações de fichas (audit)
CREATE TABLE public.ficha_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ficha_transactions TO authenticated;
GRANT ALL ON public.ficha_transactions TO service_role;

ALTER TABLE public.ficha_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own tx" ON public.ficha_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Função atômica para alterar saldo (positivo credita, negativo debita; falha se ficaria negativo)
CREATE OR REPLACE FUNCTION public.adjust_fichas(_user_id UUID, _delta INTEGER, _reason TEXT, _meta JSONB DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets
     SET fichas = fichas + _delta
   WHERE user_id = _user_id
     AND fichas + _delta >= 0
  RETURNING fichas INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Saldo de fichas insuficiente';
  END IF;

  INSERT INTO public.ficha_transactions (user_id, delta, reason, meta)
  VALUES (_user_id, _delta, _reason, _meta);

  RETURN new_balance;
END;
$$;
