DROP POLICY IF EXISTS "Authenticated can read all follows" ON public.follows;
CREATE POLICY "Users read follows they are part of" ON public.follows
FOR SELECT TO authenticated
USING ((select auth.uid()) = follower_id OR (select auth.uid()) = following_id);

DROP POLICY IF EXISTS "Authenticated can read all comments" ON public.comments;
CREATE POLICY "Author and post owner read comments" ON public.comments
FOR SELECT TO authenticated
USING (
  (select auth.uid()) = user_id
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = (select auth.uid()))
);