CREATE OR REPLACE FUNCTION public.request_guide_badge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
  SET guide_status = 'requested'
  WHERE user_id = uid
    AND is_guide = false
    AND guide_status NOT IN ('approved', 'requested');
END;
$function$;

REVOKE ALL ON FUNCTION public.request_guide_badge() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_guide_badge() FROM anon;
GRANT EXECUTE ON FUNCTION public.request_guide_badge() TO authenticated;