
-- Fix spots INSERT policy to prevent forged created_by
DROP POLICY IF EXISTS "Auth users can create spots" ON public.spots;
CREATE POLICY "Auth users can create spots"
  ON public.spots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Fix notifications INSERT policy: restrict to server-side only
DROP POLICY IF EXISTS "Auth users can create notifications" ON public.notifications;
CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);
