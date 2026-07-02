
-- 1. video_ad_claims
CREATE TABLE public.video_ad_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fichas_awarded INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_video_ad_claims_user_time ON public.video_ad_claims(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.video_ad_claims TO authenticated;
GRANT ALL ON public.video_ad_claims TO service_role;
ALTER TABLE public.video_ad_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own claims read" ON public.video_ad_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own claims insert" ON public.video_ad_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. claim_video_ad_reward RPC (7 per 3h window)
CREATE OR REPLACE FUNCTION public.claim_video_ad_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  cnt INTEGER;
  next_at TIMESTAMPTZ;
  new_balance INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT COUNT(*) INTO cnt FROM public.video_ad_claims
   WHERE user_id = uid AND created_at > now() - interval '3 hours';
  IF cnt >= 7 THEN
    SELECT MIN(created_at) + interval '3 hours' INTO next_at
      FROM public.video_ad_claims
     WHERE user_id = uid AND created_at > now() - interval '3 hours';
    RAISE EXCEPTION 'cooldown_active:%', next_at;
  END IF;
  INSERT INTO public.video_ad_claims (user_id, fichas_awarded) VALUES (uid, 5);
  new_balance := public.adjust_fichas(uid, 5, 'video_ad_reward', NULL);
  SELECT COUNT(*) INTO cnt FROM public.video_ad_claims
   WHERE user_id = uid AND created_at > now() - interval '3 hours';
  RETURN jsonb_build_object('balance', new_balance, 'claims_in_window', cnt, 'remaining', 7 - cnt);
END $$;

-- 3. Public subscribers listing (safe: display_name + one avatar url)
CREATE OR REPLACE VIEW public.public_subscribers AS
SELECT
  p.user_id,
  COALESCE(p.display_name, 'Alien') AS display_name,
  (SELECT i.avatar_url FROM public.identities i WHERE i.user_id = p.user_id ORDER BY i.created_at ASC LIMIT 1) AS avatar_url,
  p.created_at
FROM public.profiles p;

GRANT SELECT ON public.public_subscribers TO anon, authenticated;

-- 4. Subscribers count RPC
CREATE OR REPLACE FUNCTION public.subscribers_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT COUNT(*)::int FROM public.profiles $$;
GRANT EXECUTE ON FUNCTION public.subscribers_count() TO anon, authenticated;
