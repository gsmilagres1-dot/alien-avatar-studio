-- =========================================================
-- ACROSS AGE: mini game de mineração espacial
-- =========================================================

-- =====================
-- MINING STATE (nível de dificuldade atual + estatísticas de voo, 1 linha por usuário)
-- =====================
CREATE TABLE public.mining_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
  landed_count INTEGER NOT NULL DEFAULT 0,
  crashed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mining_state TO authenticated;
GRANT ALL ON public.mining_state TO service_role;

ALTER TABLE public.mining_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own mining state" ON public.mining_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER mining_state_touch BEFORE UPDATE ON public.mining_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================
-- MINING PROGRESS (total coletado por material, vitalício, 1 linha por usuário+material)
-- =====================
CREATE TABLE public.mining_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_key TEXT NOT NULL CHECK (material_key IN ('ouro','cadmio','niquel','monumento','ferramenta','alien')),
  total_collected INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, material_key)
);

GRANT SELECT ON public.mining_progress TO authenticated;
GRANT ALL ON public.mining_progress TO service_role;

ALTER TABLE public.mining_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own mining progress" ON public.mining_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER mining_progress_touch BEFORE UPDATE ON public.mining_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- submit_mining_result: registra o resultado de uma viagem completa
-- (Fase 1 pouso -> Fase 2 coleta -> Fase 3 retorno). Só o backend
-- chama isso (via service_role), o client nunca escreve direto
-- nas tabelas acima — evita gente forjando progresso pelo DevTools.
-- =========================================================
CREATE OR REPLACE FUNCTION public.submit_mining_result(
  _caller_id UUID,
  _material_key TEXT,
  _success BOOLEAN
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_landed INTEGER;
  new_crashed INTEGER;
  new_level INTEGER;
  new_total INTEGER;
  mapped_upgrade_key TEXT;
  new_upgrade_level INTEGER;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _material_key NOT IN ('ouro','cadmio','niquel','monumento','ferramenta','alien') THEN
    RAISE EXCEPTION 'invalid_material';
  END IF;

  INSERT INTO mining_state (user_id) VALUES (_caller_id)
    ON CONFLICT (user_id) DO NOTHING;

  IF _success THEN
    UPDATE mining_state
      SET landed_count = landed_count + 1,
          level = LEAST(10, 1 + ((landed_count + 1) / 10))
      WHERE user_id = _caller_id
      RETURNING landed_count, crashed_count, level INTO new_landed, new_crashed, new_level;

    INSERT INTO mining_progress (user_id, material_key, total_collected)
      VALUES (_caller_id, _material_key, 1)
      ON CONFLICT (user_id, material_key)
      DO UPDATE SET total_collected = mining_progress.total_collected + 1
      RETURNING total_collected INTO new_total;

    mapped_upgrade_key := CASE _material_key
      WHEN 'ouro'       THEN 'energy'
      WHEN 'cadmio'     THEN 'energy'
      WHEN 'niquel'     THEN 'shield'
      WHEN 'ferramenta' THEN 'radar'
      WHEN 'monumento'  THEN 'cargo'
      WHEN 'alien'      THEN 'speed'
    END;

    INSERT INTO nave_upgrades (user_id, upgrade_key, level)
      VALUES (_caller_id, mapped_upgrade_key, 1)
      ON CONFLICT (user_id, upgrade_key)
      DO UPDATE SET level = nave_upgrades.level + 1
      RETURNING level INTO new_upgrade_level;
  ELSE
    UPDATE mining_state
      SET crashed_count = crashed_count + 1
      WHERE user_id = _caller_id
      RETURNING landed_count, crashed_count, level INTO new_landed, new_crashed, new_level;
  END IF;

  RETURN jsonb_build_object(
    'level', new_level,
    'landedCount', new_landed,
    'crashedCount', new_crashed,
    'materialTotal', new_total,
    'upgradeKey', mapped_upgrade_key,
    'upgradeLevel', new_upgrade_level
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_mining_result(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
