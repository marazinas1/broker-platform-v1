-- Public read for processed brand imagery in site-assets.
DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-assets');

-- Writes limited to users holding settings.edit.
DROP POLICY IF EXISTS "site_assets_manage" ON storage.objects;
CREATE POLICY "site_assets_manage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'site-assets' AND public.current_user_has_permission('settings.edit'))
WITH CHECK (bucket_id = 'site-assets' AND public.current_user_has_permission('settings.edit'));

-- Point the agent portrait at the processed, EXIF-free AVIF.
UPDATE public.site_settings
SET primary_agent_photo_url =
  'https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/agent/dorothe-waltner-portrait.avif';
