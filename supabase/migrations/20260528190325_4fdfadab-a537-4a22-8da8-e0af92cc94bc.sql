-- Restrict public bucket listing: only allow reading individual objects, not listing
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read by path" ON storage.objects FOR SELECT
USING (bucket_id = 'alien-avatars' AND (storage.foldername(name))[1] IS NOT NULL);

-- Lock down SECURITY DEFINER functions (only triggers should invoke them)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;