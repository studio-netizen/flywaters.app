ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_guide boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guide_status text NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_profiles_guide_status ON public.profiles(guide_status) WHERE guide_status <> 'none';
