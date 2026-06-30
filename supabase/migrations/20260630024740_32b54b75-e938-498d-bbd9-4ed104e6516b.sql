
-- =========================================================
-- 1) TEAMS: restrict updates to safe profile columns, block direct inserts
-- =========================================================
DROP POLICY IF EXISTS teams_update_leader ON public.teams;
CREATE POLICY teams_update_leader_profile ON public.teams
  FOR UPDATE TO authenticated
  USING (leader_id = auth.uid())
  WITH CHECK (leader_id = auth.uid());

-- Column-level: only profile columns updatable by authenticated.
REVOKE UPDATE ON public.teams FROM authenticated;
GRANT UPDATE (name, country_code, flag_emoji, description) ON public.teams TO authenticated;

-- Explicit deny for direct inserts (creation must go through create_team).
DROP POLICY IF EXISTS teams_insert_none ON public.teams;
CREATE POLICY teams_insert_none ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- =========================================================
-- 2) BATTLES: hide pending battles; remove leader UPDATE policy
-- =========================================================
DROP POLICY IF EXISTS "Members can view battles involving their team" ON public.battles;
CREATE POLICY battles_select_members ON public.battles
  FOR SELECT TO authenticated
  USING (
    is_team_member(team_a_id, auth.uid())
    OR is_team_member(team_b_id, auth.uid())
  );

DROP POLICY IF EXISTS "Leaders of involved teams can update" ON public.battles;
DROP POLICY IF EXISTS "Leader of team_a can create" ON public.battles;
-- Battles are mutated only via SECURITY DEFINER RPCs invoked from server functions.
REVOKE INSERT, UPDATE, DELETE ON public.battles FROM authenticated;

-- =========================================================
-- 3) SECURITY DEFINER functions: accept explicit caller, revoke from authenticated
-- =========================================================

-- create_team: caller passed explicitly from server function
DROP FUNCTION IF EXISTS public.create_team(text, text, text, text);
CREATE OR REPLACE FUNCTION public.create_team(
  _caller_id uuid, _name text, _country_code text DEFAULT NULL,
  _flag_emoji text DEFAULT NULL, _description text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_team_id UUID;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF char_length(coalesce(_name,'')) < 1 OR char_length(_name) > 16 THEN
    RAISE EXCEPTION 'invalid_name_length';
  END IF;
  INSERT INTO public.teams (name, country_code, flag_emoji, description, leader_id, members_count)
  VALUES (_name, _country_code, _flag_emoji, _description, _caller_id, 1)
  RETURNING id INTO new_team_id;
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, _caller_id, 'leader');
  RETURN new_team_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_team(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- join_team_via_invite
DROP FUNCTION IF EXISTS public.join_team_via_invite(text);
CREATE OR REPLACE FUNCTION public.join_team_via_invite(_caller_id uuid, _token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv RECORD; cnt INTEGER;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO inv FROM public.team_invites WHERE token = _token;
  IF inv IS NULL THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN RAISE EXCEPTION 'invite_expired'; END IF;
  IF inv.max_uses IS NOT NULL AND inv.uses >= inv.max_uses THEN RAISE EXCEPTION 'invite_exhausted'; END IF;
  SELECT members_count INTO cnt FROM public.teams WHERE id = inv.team_id FOR UPDATE;
  IF cnt >= 50 THEN RAISE EXCEPTION 'team_full'; END IF;
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (inv.team_id, _caller_id, 'member')
  ON CONFLICT (team_id, user_id) DO NOTHING;
  UPDATE public.teams SET members_count = members_count + 1 WHERE id = inv.team_id;
  UPDATE public.team_invites SET uses = uses + 1 WHERE id = inv.id;
  RETURN inv.team_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.join_team_via_invite(uuid, text) FROM PUBLIC, anon, authenticated;

-- leave_team
DROP FUNCTION IF EXISTS public.leave_team(uuid);
CREATE OR REPLACE FUNCTION public.leave_team(_caller_id uuid, _team_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_leader BOOLEAN;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT (leader_id = _caller_id) INTO is_leader FROM public.teams WHERE id = _team_id;
  IF is_leader THEN RAISE EXCEPTION 'leader_cannot_leave'; END IF;
  DELETE FROM public.team_members WHERE team_id = _team_id AND user_id = _caller_id;
  UPDATE public.teams SET members_count = GREATEST(members_count - 1, 0) WHERE id = _team_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.leave_team(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- create_battle
DROP FUNCTION IF EXISTS public.create_battle(uuid, uuid, text, integer);
CREATE OR REPLACE FUNCTION public.create_battle(
  _caller_id uuid, _team_a_id uuid, _team_b_id uuid, _destination_key text, _bet_fichas integer
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id UUID;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT is_team_leader(_team_a_id, _caller_id) THEN RAISE EXCEPTION 'not_leader'; END IF;
  IF _bet_fichas < 0 THEN RAISE EXCEPTION 'invalid_bet'; END IF;
  IF _bet_fichas > 0 THEN
    PERFORM adjust_fichas(_caller_id, -_bet_fichas, 'battle_stake', jsonb_build_object('opponent', _team_b_id));
  END IF;
  INSERT INTO battles (team_a_id, team_b_id, destination_key, bet_fichas)
  VALUES (_team_a_id, _team_b_id, _destination_key, _bet_fichas)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_battle(uuid, uuid, uuid, text, integer) FROM PUBLIC, anon, authenticated;

-- accept_battle
DROP FUNCTION IF EXISTS public.accept_battle(uuid);
CREATE OR REPLACE FUNCTION public.accept_battle(_caller_id uuid, _battle_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b RECORD;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM battles WHERE id = _battle_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'pending' THEN RAISE EXCEPTION 'battle_not_pending'; END IF;
  IF NOT is_team_leader(b.team_b_id, _caller_id) THEN RAISE EXCEPTION 'not_leader'; END IF;
  IF b.bet_fichas > 0 THEN
    PERFORM adjust_fichas(_caller_id, -b.bet_fichas, 'battle_stake', jsonb_build_object('battle', _battle_id));
  END IF;
  UPDATE battles SET status = 'active' WHERE id = _battle_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.accept_battle(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- purchase_upgrade
DROP FUNCTION IF EXISTS public.purchase_upgrade(text);
CREATE OR REPLACE FUNCTION public.purchase_upgrade(_caller_id uuid, _upgrade_key text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_level INTEGER; cost INTEGER; new_level INTEGER;
BEGIN
  IF _caller_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT level INTO current_level FROM nave_upgrades WHERE user_id = _caller_id AND upgrade_key = _upgrade_key;
  IF current_level IS NULL THEN current_level := 0; END IF;
  new_level := current_level + 1;
  cost := new_level * 50;
  PERFORM adjust_fichas(_caller_id, -cost, 'upgrade_' || _upgrade_key, jsonb_build_object('level', new_level));
  INSERT INTO nave_upgrades (user_id, upgrade_key, level)
  VALUES (_caller_id, _upgrade_key, new_level)
  ON CONFLICT (user_id, upgrade_key) DO UPDATE SET level = EXCLUDED.level, updated_at = now();
  RETURN new_level;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.purchase_upgrade(uuid, text) FROM PUBLIC, anon, authenticated;

-- =========================================================
-- 4) finalize_battle: add team membership authorization
-- =========================================================
CREATE OR REPLACE FUNCTION public.finalize_battle(_caller_id uuid, _battle_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD; score_a INTEGER; score_b INTEGER; winner UUID;
  leader_a UUID; leader_b UUID; pot INTEGER;
BEGIN
  SELECT * INTO b FROM battles WHERE id = _battle_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'active' THEN RAISE EXCEPTION 'battle_not_active'; END IF;
  IF _caller_id IS NOT NULL
     AND NOT is_team_member(b.team_a_id, _caller_id)
     AND NOT is_team_member(b.team_b_id, _caller_id) THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  SELECT COALESCE(SUM(score),0) INTO score_a FROM battle_participants WHERE battle_id = _battle_id AND team_id = b.team_a_id;
  SELECT COALESCE(SUM(score),0) INTO score_b FROM battle_participants WHERE battle_id = _battle_id AND team_id = b.team_b_id;
  IF score_a > score_b THEN winner := b.team_a_id;
  ELSIF score_b > score_a THEN winner := b.team_b_id;
  ELSE winner := NULL; END IF;
  pot := b.bet_fichas * 2;
  IF winner IS NOT NULL AND pot > 0 THEN
    SELECT leader_id INTO leader_a FROM teams WHERE id = winner;
    PERFORM adjust_fichas(leader_a, pot, 'battle_win', jsonb_build_object('battle', _battle_id));
  ELSIF pot > 0 THEN
    SELECT leader_id INTO leader_a FROM teams WHERE id = b.team_a_id;
    SELECT leader_id INTO leader_b FROM teams WHERE id = b.team_b_id;
    PERFORM adjust_fichas(leader_a, b.bet_fichas, 'battle_refund', jsonb_build_object('battle', _battle_id));
    PERFORM adjust_fichas(leader_b, b.bet_fichas, 'battle_refund', jsonb_build_object('battle', _battle_id));
  END IF;
  UPDATE battles SET status = 'finished', winner_team_id = winner, team_a_score = score_a, team_b_score = score_b WHERE id = _battle_id;
  RETURN winner;
END;
$$;
-- Drop old finalize_battle(uuid) signature; only callable via service role now.
DROP FUNCTION IF EXISTS public.finalize_battle(uuid);
REVOKE EXECUTE ON FUNCTION public.finalize_battle(uuid, uuid) FROM PUBLIC, anon, authenticated;
