-- Enable realtime for challenge_weeks so admin changes reflect immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_weeks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_submissions;

-- Add a global setting for coming_soon mode
CREATE TABLE IF NOT EXISTS public.challenge_settings (
  id text PRIMARY KEY DEFAULT 'global',
  coming_soon boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.challenge_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read challenge settings" ON public.challenge_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Only admins can update
CREATE POLICY "Admins can update challenge settings" ON public.challenge_settings
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert challenge settings" ON public.challenge_settings
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

-- Insert default row
INSERT INTO public.challenge_settings (id, coming_soon) VALUES ('global', true)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_settings;

-- Add signup_source column to waitlist_signups for granular tracking
ALTER TABLE public.waitlist_signups ADD COLUMN IF NOT EXISTS signup_source text DEFAULT 'direct';