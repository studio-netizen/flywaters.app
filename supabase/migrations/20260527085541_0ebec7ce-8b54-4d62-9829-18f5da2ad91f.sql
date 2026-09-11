-- Fix realtime: remove unconditional public topic matches
DROP POLICY IF EXISTS "Authenticated users read own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated users read own realtime topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );

DROP POLICY IF EXISTS "Authenticated users write own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated users write own realtime topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );

-- Allow report owners to delete their own pending reports
DROP POLICY IF EXISTS "Users can delete own pending reports" ON public.reports;
CREATE POLICY "Users can delete own pending reports"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');