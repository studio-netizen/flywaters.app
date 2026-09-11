
-- Fix notifications INSERT policy to only allow authenticated users
DROP POLICY "System can create notifications" ON public.notifications;
CREATE POLICY "Auth users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
