CREATE TABLE IF NOT EXISTS public.guide_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.guide_requests TO authenticated;
GRANT ALL ON public.guide_requests TO service_role;

ALTER TABLE public.guide_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own guide request" ON public.guide_requests;
CREATE POLICY "Users can create their own guide request"
ON public.guide_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own guide request" ON public.guide_requests;
CREATE POLICY "Users can view their own guide request"
ON public.guide_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.apply_guide_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET guide_status = 'requested'
  WHERE user_id = NEW.user_id
    AND is_guide = false
    AND guide_status NOT IN ('approved', 'requested');
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_guide_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_guide_request() FROM anon;
REVOKE ALL ON FUNCTION public.apply_guide_request() FROM authenticated;

DROP TRIGGER IF EXISTS trg_apply_guide_request ON public.guide_requests;
CREATE TRIGGER trg_apply_guide_request
AFTER INSERT ON public.guide_requests
FOR EACH ROW EXECUTE FUNCTION public.apply_guide_request();

DROP FUNCTION IF EXISTS public.request_guide_badge();