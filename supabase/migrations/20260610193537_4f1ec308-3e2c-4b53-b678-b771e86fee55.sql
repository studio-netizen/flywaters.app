DROP POLICY IF EXISTS "Approved reports are public" ON public.reports;

CREATE POLICY "Approved reports are viewable by authenticated users"
ON public.reports
FOR SELECT
TO authenticated
USING (status = 'approved');

REVOKE SELECT ON public.reports FROM anon;
REVOKE SELECT (admin_notes, reviewed_by, reviewed_at) ON public.reports FROM authenticated;