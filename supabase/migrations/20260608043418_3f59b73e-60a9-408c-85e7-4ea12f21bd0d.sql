
-- 1) Reports: revoke column-level SELECT on admin fields from anon and authenticated.
-- Service role retains full access for admin tooling.
REVOKE SELECT (admin_notes, reviewed_by, reviewed_at) ON public.reports FROM anon;
REVOKE SELECT (admin_notes, reviewed_by, reviewed_at) ON public.reports FROM authenticated;
REVOKE SELECT (admin_notes, reviewed_by, reviewed_at) ON public.reports FROM PUBLIC;

-- 2) Welcome emails: explicit deny for authenticated role.
DROP POLICY IF EXISTS "Authenticated cannot read welcome_emails" ON public.welcome_emails;
CREATE POLICY "Authenticated cannot read welcome_emails"
  ON public.welcome_emails FOR SELECT
  TO authenticated
  USING (false);
