
-- Add destination_id to quiz_attempts for visa verification
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS destination_id text;
CREATE INDEX IF NOT EXISTS idx_quiz_journey_dest ON public.quiz_attempts(journey_id, destination_id);

-- Add ad-reward cooldown column to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS last_ad_reward_at timestamptz;

-- =========================================================================
-- adjust_fichas: add caller-identity guard (defense in depth) so even if
-- the function is reachable directly via PostgREST, an authenticated user
-- can never credit fichas to another user's wallet.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.adjust_fichas(_user_id uuid, _delta integer, _reason text, _meta jsonb DEFAULT NULL::jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_balance INTEGER;
  caller UUID := auth.uid();
BEGIN
  -- When invoked in an authenticated context, the caller may only act on themselves.
  -- Server-side admin (service_role) calls have caller IS NULL and bypass this check.
  IF caller IS NOT NULL AND caller <> _user_id THEN
    RAISE EXCEPTION 'forbidden_user_mismatch';
  END IF;

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
$function$;

-- =========================================================================
-- Revoke EXECUTE on SECURITY DEFINER functions from anon (none of them
-- should be callable by unauthenticated users via PostgREST).
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.adjust_fichas(uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_battle_score(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_battle(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_battle(uuid, uuid, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_battle(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.purchase_upgrade(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_team(text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_team_via_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leave_team(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_team_leader(uuid, uuid) FROM PUBLIC, anon;

-- =========================================================================
-- battle_participants: remove direct write access. All score writes now
-- go through SECURITY DEFINER (submit_battle_score) invoked server-side
-- with a server-validated score.
-- =========================================================================
DROP POLICY IF EXISTS "User can insert/update own row" ON public.battle_participants;
DROP POLICY IF EXISTS "User can submit own score" ON public.battle_participants;

-- =========================================================================
-- wallets: remove direct INSERT/UPDATE. All mutations go through
-- adjust_fichas (SECURITY DEFINER, server-side only).
-- =========================================================================
DROP POLICY IF EXISTS "users insert own wallet" ON public.wallets;
DROP POLICY IF EXISTS "users update own wallet" ON public.wallets;

-- =========================================================================
-- storage avatar policies: restrict writes to authenticated; keep public
-- read so shared profile images still load over signed-out clients.
-- =========================================================================
DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;

CREATE POLICY "avatars user upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'alien-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars user update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'alien-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'alien-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars user delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'alien-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
