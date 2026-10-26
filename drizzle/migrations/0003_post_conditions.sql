ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS conditions jsonb;
GRANT INSERT (conditions) ON public.posts TO authenticated;
GRANT SELECT (conditions) ON public.posts TO authenticated;