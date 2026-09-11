
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,
  actor_email TEXT,
  actor_role TEXT DEFAULT 'user',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_actor_email ON public.audit_logs (actor_email);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- No one can read, update, or delete from client. Only service role bypasses RLS.
CREATE POLICY "No public read access to audit_logs"
  ON public.audit_logs FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "No public insert to audit_logs"
  ON public.audit_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No public update to audit_logs"
  ON public.audit_logs FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "No public delete to audit_logs"
  ON public.audit_logs FOR DELETE
  TO anon, authenticated
  USING (false);
