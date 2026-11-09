CREATE TABLE public.admin_sessions (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_sessions TO service_role;
REVOKE ALL ON public.admin_sessions FROM anon, authenticated;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.admin_sessions IS 'Server-only hashed admin sessions. No client policies; each privileged endpoint verifies expiry and revocation.';