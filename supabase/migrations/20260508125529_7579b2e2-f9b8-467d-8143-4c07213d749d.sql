ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS hatch_activity TEXT[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hatch_activity TEXT[];
CREATE INDEX IF NOT EXISTS idx_spots_hatch_activity ON public.spots USING GIN(hatch_activity);
CREATE INDEX IF NOT EXISTS idx_posts_hatch_activity ON public.posts USING GIN(hatch_activity);