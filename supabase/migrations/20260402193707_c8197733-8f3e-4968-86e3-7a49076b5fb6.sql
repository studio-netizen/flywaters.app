
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  cover_image_url text,
  cover_image_alt text,
  body_html text,
  excerpt text,
  author text DEFAULT 'Team Flywaters',
  status text DEFAULT 'draft',
  published_at timestamptz,
  seo_title text,
  meta_description text,
  focus_keyword text,
  category text,
  tags text[],
  reading_time_minutes int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts FOR SELECT
TO public
USING (status = 'published');

-- Service role has full access (for admin edge function)
CREATE POLICY "Service role can manage blog posts"
ON public.blog_posts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
