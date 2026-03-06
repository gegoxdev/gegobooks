
-- Create waitlist_signups table
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  business_type TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'priority', 'founder')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public waitlist signup)
CREATE POLICY "Anyone can sign up for waitlist"
  ON public.waitlist_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated can read
CREATE POLICY "Authenticated can view signups"
  ON public.waitlist_signups FOR SELECT
  TO authenticated
  USING (true);

-- Create tier_counts table for live counters
CREATE TABLE public.tier_counts (
  id TEXT PRIMARY KEY,
  claimed INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL
);

ALTER TABLE public.tier_counts ENABLE ROW LEVEL SECURITY;

-- Anyone can read tier counts
CREATE POLICY "Anyone can read tier counts"
  ON public.tier_counts FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert initial tier counts
INSERT INTO public.tier_counts (id, claimed, total) VALUES
  ('priority', 317, 1000),
  ('founder', 23, 100);

-- Function to auto-assign position and increment tier count
CREATE OR REPLACE FUNCTION public.handle_waitlist_signup()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := (SELECT COUNT(*) + 1 FROM public.waitlist_signups);
  IF NEW.tier IN ('priority', 'founder') THEN
    UPDATE public.tier_counts SET claimed = claimed + 1 WHERE id = NEW.tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_waitlist_signup
  BEFORE INSERT ON public.waitlist_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_waitlist_signup();
