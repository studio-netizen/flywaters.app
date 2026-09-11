
-- 1. New owner-only consents table
CREATE TABLE IF NOT EXISTS public.user_consents (
  user_id UUID PRIMARY KEY,
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own consents" ON public.user_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own consents" ON public.user_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own consents" ON public.user_consents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own consents" ON public.user_consents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate any existing data from profiles
INSERT INTO public.user_consents (user_id, terms_accepted_at, privacy_accepted_at, marketing_consent)
SELECT user_id, terms_accepted_at, privacy_accepted_at, COALESCE(marketing_consent, false)
FROM public.profiles
WHERE terms_accepted_at IS NOT NULL
   OR privacy_accepted_at IS NOT NULL
   OR marketing_consent IS TRUE
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop the now-sensitive columns from public profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS terms_accepted_at,
  DROP COLUMN IF EXISTS privacy_accepted_at,
  DROP COLUMN IF EXISTS marketing_consent;

-- 4. Tighten realtime topic policies (prefix match instead of substring)
DROP POLICY IF EXISTS "Authenticated users read own realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users write own realtime topics" ON realtime.messages;

CREATE POLICY "Authenticated users read own realtime topics"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() = (auth.uid())::text
    OR realtime.topic() LIKE ((auth.uid())::text || ':%')
    OR realtime.topic() LIKE ((auth.uid())::text || '-%')
  );

CREATE POLICY "Authenticated users write own realtime topics"
  ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() = (auth.uid())::text
    OR realtime.topic() LIKE ((auth.uid())::text || ':%')
    OR realtime.topic() LIKE ((auth.uid())::text || '-%')
  );

-- 5. Remove notifications from realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
END $$;

-- 6. Storage policies for reports bucket - allow owners to delete/update their files
CREATE POLICY "Users can delete own report images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own report images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
