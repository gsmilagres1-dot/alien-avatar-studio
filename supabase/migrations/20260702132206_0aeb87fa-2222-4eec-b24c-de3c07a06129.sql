
-- 1) Team ranking points (accumulated battle wins)
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS ranking_points INTEGER NOT NULL DEFAULT 0;

-- 2) Battle timing: when the quiz clock started
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS active_at TIMESTAMPTZ;

-- 3) accept_battle: also mark active_at = now()
CREATE OR REPLACE FUNCTION public.accept_battle(_caller_id uuid, _battle_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  UPDATE battles SET status = 'active', active_at = now() WHERE id = _battle_id;
END;
$function$;

-- 4) finalize_battle: award +1000 ranking_points to the winning team
CREATE OR REPLACE FUNCTION public.finalize_battle(_caller_id uuid, _battle_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Award ranking points to the winner
  IF winner IS NOT NULL THEN
    UPDATE public.teams SET ranking_points = ranking_points + 1000 WHERE id = winner;
  END IF;
  UPDATE battles SET status = 'finished', winner_team_id = winner, team_a_score = score_a, team_b_score = score_b WHERE id = _battle_id;
  RETURN winner;
END;
$function$;

-- 5) Expire an active battle whose 15-minute window has ended.
-- Any participant of either team may call this. It fills missing scores with 0
-- and then delegates to finalize_battle.
CREATE OR REPLACE FUNCTION public.expire_battle(_battle_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  b RECORD;
  m RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM battles WHERE id = _battle_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'active' THEN RETURN b.winner_team_id; END IF;
  IF b.active_at IS NULL OR b.active_at + interval '15 minutes' > now() THEN
    RAISE EXCEPTION 'battle_not_expired';
  END IF;
  IF NOT is_team_member(b.team_a_id, uid) AND NOT is_team_member(b.team_b_id, uid) THEN
    RAISE EXCEPTION 'not_participant';
  END IF;
  -- Fill zero-scores for members who never submitted
  FOR m IN
    SELECT tm.user_id, tm.team_id FROM team_members tm
     WHERE tm.team_id IN (b.team_a_id, b.team_b_id)
       AND NOT EXISTS (SELECT 1 FROM battle_participants bp WHERE bp.battle_id = _battle_id AND bp.user_id = tm.user_id)
  LOOP
    INSERT INTO battle_participants (battle_id, user_id, team_id, score, completed_at)
    VALUES (_battle_id, m.user_id, m.team_id, 0, now())
    ON CONFLICT (battle_id, user_id) DO NOTHING;
  END LOOP;
  RETURN public.finalize_battle(uid, _battle_id);
END;
$function$;
