
-- CRM contacts table
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  source TEXT DEFAULT 'organic',
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- Only the user can view their own CRM record
CREATE POLICY "Users can view own crm record"
  ON public.crm_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No public insert/update/delete — managed by trigger
CREATE POLICY "No public write to crm_contacts"
  ON public.crm_contacts FOR ALL
  TO anon
  USING (false);

-- Trigger function: auto-create CRM contact on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_crm_contact()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.crm_contacts (user_id, email, first_name, last_name, source, registered_at, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1), split_part(NEW.email, '@', 1)),
    NULLIF(
      TRIM(SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', '')) + 1)),
      ''
    ),
    CASE WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google' ELSE 'email' END,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    last_login = now(),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users on insert
CREATE TRIGGER on_auth_user_created_crm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_crm_contact();
