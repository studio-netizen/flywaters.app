CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to settings" ON public.app_settings FOR ALL USING (false);

INSERT INTO public.app_settings (key, value) VALUES ('welcome_message', ''), ('maintenance_mode', 'false');