
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'user';

-- Allow leads (non-authenticated) to be inserted via edge function
CREATE POLICY "Service role can manage crm_contacts" ON public.crm_contacts
FOR ALL TO service_role USING (true) WITH CHECK (true);
