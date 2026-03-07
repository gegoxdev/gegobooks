
-- Add new columns to waitlist_signups
ALTER TABLE public.waitlist_signups 
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referrals_count integer NOT NULL DEFAULT 0;

-- Rename position to waitlist_position
ALTER TABLE public.waitlist_signups RENAME COLUMN position TO waitlist_position;

-- Drop old columns
ALTER TABLE public.waitlist_signups 
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS business_type,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS tier;

-- Add length constraints
ALTER TABLE public.waitlist_signups 
  ADD CONSTRAINT chk_full_name_len CHECK (char_length(full_name) <= 200),
  ADD CONSTRAINT chk_email_len CHECK (char_length(email) <= 255),
  ADD CONSTRAINT chk_referral_code_len CHECK (referral_code IS NULL OR char_length(referral_code) = 8),
  ADD CONSTRAINT chk_referred_by_len CHECK (referred_by IS NULL OR char_length(referred_by) <= 8),
  ADD CONSTRAINT chk_utm_source_len CHECK (utm_source IS NULL OR char_length(utm_source) <= 200),
  ADD CONSTRAINT chk_utm_medium_len CHECK (utm_medium IS NULL OR char_length(utm_medium) <= 200),
  ADD CONSTRAINT chk_utm_campaign_len CHECK (utm_campaign IS NULL OR char_length(utm_campaign) <= 200),
  ADD CONSTRAINT chk_user_type CHECK (user_type IN ('user', 'accountant', 'both'));

-- Drop tier_counts table
DROP TABLE IF EXISTS public.tier_counts;

-- Update RLS policies on waitlist_signups
DROP POLICY IF EXISTS "Anyone can sign up for waitlist" ON public.waitlist_signups;
DROP POLICY IF EXISTS "Authenticated can view signups" ON public.waitlist_signups;

CREATE POLICY "Anon can insert signup" ON public.waitlist_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read own signup by email" ON public.waitlist_signups
  FOR SELECT USING (true);

-- Replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_waitlist_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  referrer_id uuid;
BEGIN
  -- Assign waitlist position
  NEW.waitlist_position := (SELECT COUNT(*) + 1 FROM public.waitlist_signups);

  -- Generate unique 8-char referral code
  LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.waitlist_signups WHERE referral_code = new_code);
  END LOOP;
  NEW.referral_code := new_code;

  -- Process referral reward
  IF NEW.referred_by IS NOT NULL AND NEW.referred_by != '' THEN
    SELECT id INTO referrer_id FROM public.waitlist_signups WHERE referral_code = NEW.referred_by;
    IF referrer_id IS NOT NULL THEN
      UPDATE public.waitlist_signups 
      SET referrals_count = referrals_count + 1,
          waitlist_position = GREATEST(waitlist_position - 1, 1)
      WHERE id = referrer_id;
    ELSE
      NEW.referred_by := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_waitlist_signup ON public.waitlist_signups;
CREATE TRIGGER on_waitlist_signup
  BEFORE INSERT ON public.waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION public.handle_waitlist_signup();

-- Create admin_users table for admin panel access
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;

-- Admin can read all signups (authenticated)
CREATE POLICY "Admin can read all signups" ON public.waitlist_signups
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can read admin_users
CREATE POLICY "Admin can read admin_users" ON public.admin_users
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
