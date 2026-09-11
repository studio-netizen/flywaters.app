REVOKE SELECT (admin_notes, reviewed_by, reviewed_at) ON public.reports FROM authenticated, anon;
GRANT SELECT (admin_notes, reviewed_by, reviewed_at) ON public.reports TO service_role;