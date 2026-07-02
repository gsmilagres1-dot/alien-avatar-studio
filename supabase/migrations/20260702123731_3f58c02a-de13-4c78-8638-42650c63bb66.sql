
-- 1) Restrictive write policies (deny-all for client roles; server uses service_role which bypasses RLS)

-- battle_participants: no client INSERT/UPDATE/DELETE
CREATE POLICY "bp_no_client_insert" ON public.battle_participants FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "bp_no_client_update" ON public.battle_participants FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "bp_no_client_delete" ON public.battle_participants FOR DELETE TO authenticated, anon USING (false);

-- ficha_transactions: no client writes
CREATE POLICY "ft_no_client_insert" ON public.ficha_transactions FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "ft_no_client_update" ON public.ficha_transactions FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "ft_no_client_delete" ON public.ficha_transactions FOR DELETE TO authenticated, anon USING (false);

-- payment_transactions: no client writes
CREATE POLICY "pt_no_client_insert" ON public.payment_transactions FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "pt_no_client_update" ON public.payment_transactions FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "pt_no_client_delete" ON public.payment_transactions FOR DELETE TO authenticated, anon USING (false);

-- team_invites: block client UPDATE (redemption goes through SECURITY DEFINER RPC)
CREATE POLICY "ti_no_client_update" ON public.team_invites FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

-- team_members: block client INSERT/UPDATE (creation via create_team/join_team_via_invite RPCs)
CREATE POLICY "tm_no_client_insert" ON public.team_members FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "tm_no_client_update" ON public.team_members FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

-- video_ad_claims: block UPDATE/DELETE (INSERT stays scoped to auth.uid = user_id)
CREATE POLICY "vac_no_client_update" ON public.video_ad_claims FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "vac_no_client_delete" ON public.video_ad_claims FOR DELETE TO authenticated, anon USING (false);

-- wallets: no client writes (all balance changes via adjust_fichas SECURITY DEFINER)
CREATE POLICY "w_no_client_insert" ON public.wallets FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "w_no_client_update" ON public.wallets FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "w_no_client_delete" ON public.wallets FOR DELETE TO authenticated, anon USING (false);

-- 2) Revoke anon EXECUTE on SECURITY DEFINER functions that should require sign-in
REVOKE EXECUTE ON FUNCTION public.claim_video_ad_reward() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.subscribers_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_video_ad_reward() TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribers_count() TO authenticated;

-- 3) Restrict avatar public read to authenticated users
DROP POLICY IF EXISTS "avatars public read by path" ON storage.objects;
CREATE POLICY "avatars authenticated read by path" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'alien-avatars' AND (storage.foldername(name))[1] IS NOT NULL);
