
-- Add UPDATE policies for storage buckets
CREATE POLICY "Users can update own files in posts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'posts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files in reviews"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reviews' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files in spots"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'spots' AND (auth.uid())::text = (storage.foldername(name))[1]);
