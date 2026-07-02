
-- 1) Revoke public/anon EXECUTE on SECURITY DEFINER function reachable by anon.
--    Only expire_battle was granted to anon; keep authenticated + service_role.
REVOKE EXECUTE ON FUNCTION public.expire_battle(uuid) FROM PUBLIC, anon;

-- 2) Storage policies on the alien-avatars bucket currently target the
--    `authenticated` role, which in Supabase also covers anonymous sign-in
--    users (JWTs with is_anonymous = true). Anonymous sign-in is not used
--    by this app, so tighten every policy to exclude anonymous JWTs.

DROP POLICY IF EXISTS "avatars authenticated read by path" ON storage.objects;
CREATE POLICY "avatars authenticated read by path"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'alien-avatars'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
CREATE POLICY "avatars user upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'alien-avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'alien-avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  )
  WITH CHECK (
    bucket_id = 'alien-avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
CREATE POLICY "avatars user delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'alien-avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
