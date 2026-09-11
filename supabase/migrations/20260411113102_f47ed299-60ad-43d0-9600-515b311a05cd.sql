
-- =============================================
-- PROFILES
-- =============================================
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- POSTS
-- =============================================
DROP POLICY IF EXISTS "Posts viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Auth users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Authenticated can read all posts"
  ON public.posts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- SPOTS
-- =============================================
DROP POLICY IF EXISTS "Spots viewable by everyone" ON public.spots;
DROP POLICY IF EXISTS "Auth users can create spots" ON public.spots;
DROP POLICY IF EXISTS "Creators can update spots" ON public.spots;

CREATE POLICY "Authenticated can read all spots"
  ON public.spots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own spots"
  ON public.spots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own spots"
  ON public.spots FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own spots"
  ON public.spots FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- =============================================
-- REVIEWS
-- =============================================
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Auth users can review" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON public.reviews;

CREATE POLICY "Authenticated can read all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own review"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own review"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- MESSAGES
-- =============================================
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Auth users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Receiver can update read status" ON public.messages;

CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- No DELETE policy on messages

-- =============================================
-- FOLLOWS
-- =============================================
DROP POLICY IF EXISTS "Follows viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

CREATE POLICY "Authenticated can read all follows"
  ON public.follows FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- =============================================
-- COMMENTS
-- =============================================
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Auth users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Authenticated can read all comments"
  ON public.comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- LIKES
-- =============================================
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Auth users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;

CREATE POLICY "Authenticated can read all likes"
  ON public.likes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- BLOG_POSTS (keep public read for published)
-- =============================================
-- Already correct: public SELECT where status='published', service_role ALL

-- =============================================
-- STORAGE: file size + mime types
-- =============================================
UPDATE storage.buckets SET file_size_limit = 20971520, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'] WHERE id IN ('avatars', 'posts', 'spots', 'reviews');
