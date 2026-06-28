
-- =====================
-- NAVE UPGRADES
-- =====================
CREATE TABLE public.nave_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_key TEXT NOT NULL,        -- 'speed', 'shield', 'radar', 'energy', 'cargo'
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, upgrade_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nave_upgrades TO authenticated;
GRANT ALL ON public.nave_upgrades TO service_role;

ALTER TABLE public.nave_upgrades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access" ON public.nave_upgrades
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER nave_upgrades_updated_at
BEFORE UPDATE ON public.nave_upgrades
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================
-- BATTLES
-- =====================
CREATE TYPE public.battle_status AS ENUM ('pending', 'active', 'finished', 'cancelled');

CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_b_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  destination_key TEXT NOT NULL,
  bet_fichas INTEGER NOT NULL DEFAULT 0 CHECK (bet_fichas >= 0),
  status public.battle_status NOT NULL DEFAULT 'pending',
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_a_score INTEGER NOT NULL DEFAULT 0,
  team_b_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.battles TO authenticated;
GRANT ALL ON public.battles TO service_role;

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view battles involving their team"
  ON public.battles FOR SELECT USING (
    public.is_team_member(team_a_id, auth.uid()) OR
    public.is_team_member(team_b_id, auth.uid()) OR
    status = 'pending'
  );

CREATE POLICY "Leader of team_a can create"
  ON public.battles FOR INSERT
  WITH CHECK (public.is_team_leader(team_a_id, auth.uid()));

CREATE POLICY "Leaders of involved teams can update"
  ON public.battles FOR UPDATE USING (
    public.is_team_leader(team_a_id, auth.uid()) OR
    public.is_team_leader(team_b_id, auth.uid())
  );

CREATE TRIGGER battles_updated_at
BEFORE UPDATE ON public.battles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================
-- BATTLE PARTICIPANTS
-- =====================
CREATE TABLE public.battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  score INTEGER,                  -- null until submitted
  completed_at TIMESTAMPTZ,
  UNIQUE(battle_id, user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.battle_participants TO authenticated;
GRANT ALL ON public.battle_participants TO service_role;

ALTER TABLE public.battle_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own battle"
  ON public.battle_participants FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.battles b
      WHERE b.id = battle_id AND (
        public.is_team_member(b.team_a_id, auth.uid()) OR
        public.is_team_member(b.team_b_id, auth.uid())
      )
    )
  );

CREATE POLICY "User can insert/update own row"
  ON public.battle_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can submit own score"
  ON public.battle_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================
-- RPC: create_battle
-- =====================
CREATE OR REPLACE FUNCTION public.create_battle(
  _team_a_id UUID,
  _team_b_id UUID,
  _destination_key TEXT,
  _bet_fichas INTEGER
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  new_id UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT is_team_leader(_team_a_id, uid) THEN RAISE EXCEPTION 'not_leader'; END IF;
  IF _bet_fichas < 0 THEN RAISE EXCEPTION 'invalid_bet'; END IF;

  -- Deduct bet from challenger
  IF _bet_fichas > 0 THEN
    PERFORM adjust_fichas(uid, -_bet_fichas, 'battle_stake', jsonb_build_object('opponent', _team_b_id));
  END IF;

  INSERT INTO battles (team_a_id, team_b_id, destination_key, bet_fichas)
  VALUES (_team_a_id, _team_b_id, _destination_key, _bet_fichas)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- =====================
-- RPC: accept_battle
-- =====================
CREATE OR REPLACE FUNCTION public.accept_battle(_battle_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  b RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM battles WHERE id = _battle_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'pending' THEN RAISE EXCEPTION 'battle_not_pending'; END IF;
  IF NOT is_team_leader(b.team_b_id, uid) THEN RAISE EXCEPTION 'not_leader'; END IF;

  -- Deduct bet from acceptor leader
  IF b.bet_fichas > 0 THEN
    PERFORM adjust_fichas(uid, -b.bet_fichas, 'battle_stake', jsonb_build_object('battle', _battle_id));
  END IF;

  UPDATE battles SET status = 'active' WHERE id = _battle_id;
END;
$$;

-- =====================
-- RPC: submit_battle_score
-- =====================
CREATE OR REPLACE FUNCTION public.submit_battle_score(_battle_id UUID, _score INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  b RECORD;
  my_team UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM battles WHERE id = _battle_id;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'active' THEN RAISE EXCEPTION 'battle_not_active'; END IF;

  -- Determine which team user belongs to
  IF is_team_member(b.team_a_id, uid) THEN my_team := b.team_a_id;
  ELSIF is_team_member(b.team_b_id, uid) THEN my_team := b.team_b_id;
  ELSE RAISE EXCEPTION 'not_participant';
  END IF;

  INSERT INTO battle_participants (battle_id, user_id, team_id, score, completed_at)
  VALUES (_battle_id, uid, my_team, _score, now())
  ON CONFLICT (battle_id, user_id) DO UPDATE SET score = EXCLUDED.score, completed_at = now();
END;
$$;

-- =====================
-- RPC: finalize_battle (called after all participants submitted)
-- =====================
CREATE OR REPLACE FUNCTION public.finalize_battle(_battle_id UUID)
RETURNS UUID -- returns winner_team_id
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD;
  score_a INTEGER;
  score_b INTEGER;
  winner UUID;
  leader_a UUID;
  leader_b UUID;
  pot INTEGER;
BEGIN
  SELECT * INTO b FROM battles WHERE id = _battle_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'active' THEN RAISE EXCEPTION 'battle_not_active'; END IF;

  SELECT COALESCE(SUM(score),0) INTO score_a FROM battle_participants WHERE battle_id = _battle_id AND team_id = b.team_a_id;
  SELECT COALESCE(SUM(score),0) INTO score_b FROM battle_participants WHERE battle_id = _battle_id AND team_id = b.team_b_id;

  IF score_a > score_b THEN winner := b.team_a_id;
  ELSIF score_b > score_a THEN winner := b.team_b_id;
  ELSE winner := NULL; -- tie
  END IF;

  pot := b.bet_fichas * 2;

  IF winner IS NOT NULL AND pot > 0 THEN
    SELECT leader_id INTO leader_a FROM teams WHERE id = winner;
    PERFORM adjust_fichas(leader_a, pot, 'battle_win', jsonb_build_object('battle', _battle_id));
  ELSIF pot > 0 THEN
    -- Tie: return stakes
    SELECT leader_id INTO leader_a FROM teams WHERE id = b.team_a_id;
    SELECT leader_id INTO leader_b FROM teams WHERE id = b.team_b_id;
    PERFORM adjust_fichas(leader_a, b.bet_fichas, 'battle_refund', jsonb_build_object('battle', _battle_id));
    PERFORM adjust_fichas(leader_b, b.bet_fichas, 'battle_refund', jsonb_build_object('battle', _battle_id));
  END IF;

  UPDATE battles SET status = 'finished', winner_team_id = winner, team_a_score = score_a, team_b_score = score_b WHERE id = _battle_id;

  RETURN winner;
END;
$$;

-- =====================
-- RPC: purchase_upgrade
-- =====================
CREATE OR REPLACE FUNCTION public.purchase_upgrade(_upgrade_key TEXT)
RETURNS INTEGER -- new level
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  current_level INTEGER;
  cost INTEGER;
  new_level INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT level INTO current_level FROM nave_upgrades WHERE user_id = uid AND upgrade_key = _upgrade_key;
  IF current_level IS NULL THEN current_level := 0; END IF;

  new_level := current_level + 1;
  cost := new_level * 50; -- 50 per level

  PERFORM adjust_fichas(uid, -cost, 'upgrade_' || _upgrade_key, jsonb_build_object('level', new_level));

  INSERT INTO nave_upgrades (user_id, upgrade_key, level)
  VALUES (uid, _upgrade_key, new_level)
  ON CONFLICT (user_id, upgrade_key) DO UPDATE SET level = EXCLUDED.level, updated_at = now();

  RETURN new_level;
END;
$$;
