ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.slugify_text(_t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(
    lower(translate(coalesce(_t,''),
      'àáâãäåèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ''',
      'aaaaaaeeeeiiiiooooouuuuncaaaaaaeeeeiiiiooooouuuunc-')),
    '[^a-z0-9]+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.set_spot_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND (TG_OP = 'INSERT' OR NEW.name = OLD.name) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.name = OLD.name THEN RETURN NEW; END IF;
  base := left(public.slugify_text(NEW.name), 80);
  IF base = '' THEN base := 'spot'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.spots WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1; candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;

DO $$ DECLARE r record; base text; candidate text; n int;
BEGIN
  FOR r IN SELECT id, name FROM public.spots WHERE slug IS NULL ORDER BY created_at LOOP
    base := left(public.slugify_text(r.name), 80);
    IF base = '' THEN base := 'spot'; END IF;
    candidate := base; n := 1;
    WHILE EXISTS (SELECT 1 FROM public.spots WHERE slug = candidate) LOOP
      n := n + 1; candidate := base || '-' || n;
    END LOOP;
    UPDATE public.spots SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS spots_slug_key ON public.spots(slug);

DROP TRIGGER IF EXISTS spots_set_slug ON public.spots;
CREATE TRIGGER spots_set_slug BEFORE INSERT OR UPDATE OF name ON public.spots
FOR EACH ROW EXECUTE FUNCTION public.set_spot_slug();