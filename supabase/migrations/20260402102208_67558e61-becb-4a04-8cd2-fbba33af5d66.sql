-- Add DELETE policies for all buckets (owner can delete own files)
CREATE POLICY "Auth delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth delete posts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'posts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth delete reviews"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reviews' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth delete spots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'spots' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Tighten INSERT policies: enforce folder ownership
DROP POLICY IF EXISTS "Auth upload posts" ON storage.objects;
CREATE POLICY "Auth upload posts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'posts' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth upload reviews" ON storage.objects;
CREATE POLICY "Auth upload reviews"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reviews' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth upload spots" ON storage.objects;
CREATE POLICY "Auth upload spots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'spots' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
CREATE POLICY "Auth upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);