
CREATE OR REPLACE FUNCTION public.submit_battle_score(_battle_id uuid, _score integer, _caller_id uuid DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := COALESCE(_caller_id, auth.uid());
  b RECORD;
  my_team UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM battles WHERE id = _battle_id;
  IF b IS NULL THEN RAISE EXCEPTION 'battle_not_found'; END IF;
  IF b.status <> 'active' THEN RAISE EXCEPTION 'battle_not_active'; END IF;

  IF is_team_member(b.team_a_id, uid) THEN my_team := b.team_a_id;
  ELSIF is_team_member(b.team_b_id, uid) THEN my_team := b.team_b_id;
  ELSE RAISE EXCEPTION 'not_participant';
  END IF;

  INSERT INTO battle_participants (battle_id, user_id, team_id, score, completed_at)
  VALUES (_battle_id, uid, my_team, _score, now())
  ON CONFLICT (battle_id, user_id) DO UPDATE SET score = EXCLUDED.score, completed_at = now();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.submit_battle_score(uuid, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_battle_score(uuid, integer, uuid) TO authenticated, service_role;
