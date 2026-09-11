
CREATE TABLE public.welcome_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to welcome_emails"
  ON public.welcome_emails FOR ALL
  TO public
  USING (false);
