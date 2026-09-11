-- profiles: remove blanket update rights, allow only user-editable columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, display_name, avatar_url, bio, fishing_types, instagram_url, website_url, onboarding_completed, age_confirmed, referred_by, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- posts: derived counters not writable by users
REVOKE UPDATE ON public.posts FROM authenticated;
GRANT UPDATE (image_url, caption, location_tag, fish_species, gear_used, spot_id, fishing_technique, hatch_activity) ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

-- spots: avg_rating / review_count not writable by users
REVOKE UPDATE ON public.spots FROM authenticated;
GRANT UPDATE (name, description, spot_type, latitude, longitude, fish_species, access_info, photos, hatch_activity, updated_at) ON public.spots TO authenticated;
GRANT ALL ON public.spots TO service_role;

-- messages: receiver may only toggle the read flag
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read) ON public.messages TO public;
REVOKE UPDATE (read) ON public.messages FROM anon;
GRANT ALL ON public.messages TO service_role;

-- guide badge requests go through a controlled function (never self-approval)
CREATE OR REPLACE FUNCTION public.request_guide_badge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
  SET guide_status = 'requested'
  WHERE user_id = auth.uid()
    AND is_guide = false
    AND guide_status <> 'approved';
END;
$$;
REVOKE ALL ON FUNCTION public.request_guide_badge() FROM public;
GRANT EXECUTE ON FUNCTION public.request_guide_badge() TO authenticated;