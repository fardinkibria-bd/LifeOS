-- Profile pictures are stored in a public bucket so avatar URLs can be rendered
-- by the authenticated app and shared UI surfaces.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "avatar_read_public" ON storage.objects;
CREATE POLICY "avatar_read_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatar_insert_own_folder" ON storage.objects;
CREATE POLICY "avatar_insert_own_folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text));

DROP POLICY IF EXISTS "avatar_update_own_folder" ON storage.objects;
CREATE POLICY "avatar_update_own_folder"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text))
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text));

DROP POLICY IF EXISTS "avatar_delete_own_folder" ON storage.objects;
CREATE POLICY "avatar_delete_own_folder"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text));
