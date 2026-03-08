-- 1. Drop and recreate referral_leaderboard view WITHOUT email
DROP VIEW IF EXISTS public.referral_leaderboard;
CREATE VIEW public.referral_leaderboard AS
  SELECT full_name, referrals_count
  FROM public.waitlist_signups
  WHERE referrals_count > 0
  ORDER BY referrals_count DESC
  LIMIT 20;

-- Revoke anon, grant only authenticated
REVOKE SELECT ON public.referral_leaderboard FROM anon;
GRANT SELECT ON public.referral_leaderboard TO authenticated;

-- 2. Create profiles table for tier management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  tier text CHECK (tier IN ('free', 'priority', 'founder')) DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Create RPC to get user's own waitlist data (authenticated)
CREATE OR REPLACE FUNCTION public.get_my_waitlist_status()
RETURNS TABLE(full_name text, email text, waitlist_position int, referrals_count int, referral_code text, user_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT au.email INTO user_email FROM auth.users au WHERE au.id = auth.uid();
  RETURN QUERY
    SELECT ws.full_name, ws.email, ws.waitlist_position, ws.referrals_count, ws.referral_code, ws.user_type
    FROM public.waitlist_signups ws
    WHERE ws.email = user_email
    LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_waitlist_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_waitlist_status() TO authenticated;