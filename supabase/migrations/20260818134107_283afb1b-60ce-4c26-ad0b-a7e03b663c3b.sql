CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = (SELECT COUNT(*) FROM public.likes WHERE post_id = NEW.post_id) WHERE id = NEW.post_id;
    RETURN NEW;
  ELSE
    UPDATE public.posts SET like_count = (SELECT COUNT(*) FROM public.likes WHERE post_id = OLD.post_id) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = (SELECT COUNT(*) FROM public.comments WHERE post_id = NEW.post_id) WHERE id = NEW.post_id;
    RETURN NEW;
  ELSE
    UPDATE public.posts SET comment_count = (SELECT COUNT(*) FROM public.comments WHERE post_id = OLD.post_id) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_like_count ON public.likes;
CREATE TRIGGER trg_sync_post_like_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_like_count();

DROP TRIGGER IF EXISTS trg_sync_post_comment_count ON public.comments;
CREATE TRIGGER trg_sync_post_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();

UPDATE public.posts p SET
  like_count = (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id),
  comment_count = (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id);