DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;
CREATE POLICY "Anyone can insert valid contact submissions" ON public.contact_submissions
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(nome)) BETWEEN 1 AND 100
  AND length(btrim(cognome)) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (cellulare IS NULL OR length(cellulare) <= 30)
  AND (provincia IS NULL OR length(provincia) <= 100)
  AND length(btrim(messaggio)) BETWEEN 1 AND 5000
);

DROP POLICY IF EXISTS "Public read posts" ON storage.objects;
DROP POLICY IF EXISTS "Report images publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public read spots" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read reviews" ON storage.objects;
CREATE POLICY "Owners can read their own files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('posts','reports','spots','avatars','reviews') AND owner_id = (select auth.uid()::text));