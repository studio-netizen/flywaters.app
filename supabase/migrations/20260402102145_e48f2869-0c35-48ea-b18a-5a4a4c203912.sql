-- 1. Fix notifications INSERT policy: restrict actor_id to auth.uid()
DROP POLICY IF EXISTS "Auth users can create notifications" ON public.notifications;
CREATE POLICY "Auth users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- 2. Fix contact_submissions: explicit anon SELECT deny + service_role SELECT
DROP POLICY IF EXISTS "No one can read contact submissions" ON public.contact_submissions;

CREATE POLICY "Anon cannot read contact submissions"
ON public.contact_submissions
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Authenticated cannot read contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (false);

CREATE POLICY "Service role can read contact submissions"
ON public.contact_submissions
FOR SELECT
TO service_role
USING (true);

-- 3. Fix contact_submissions INSERT: restrict to anon+authenticated (already true, but narrow the WITH CHECK)
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;
CREATE POLICY "Anyone can insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);