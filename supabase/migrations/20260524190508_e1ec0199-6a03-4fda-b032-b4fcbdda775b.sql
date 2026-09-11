
-- 1. Tighten reports INSERT policy to force status='pending'
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 2. Audit logs: explicit service_role read policy
DROP POLICY IF EXISTS "Service role can read audit logs" ON public.audit_logs;
CREATE POLICY "Service role can read audit logs"
  ON public.audit_logs
  FOR SELECT
  TO service_role
  USING (true);

-- 3. Revoke public EXECUTE on SECURITY DEFINER trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_crm_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_report_approved() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_spot_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Realtime channel authorization: only authenticated users, and only for own user-scoped topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated users read own realtime topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow only postgres_changes channels and topics that include the user's id
    (realtime.topic() LIKE '%' || auth.uid()::text || '%')
    OR (realtime.topic() = 'realtime:public:messages')
    OR (realtime.topic() = 'realtime:public:notifications')
  );

DROP POLICY IF EXISTS "Authenticated users write own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated users write own realtime topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );
