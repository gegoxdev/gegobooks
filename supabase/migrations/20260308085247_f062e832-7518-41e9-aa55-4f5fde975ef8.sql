
-- 1. Revoke anon EXECUTE on get_waitlist_growth and add admin guard
REVOKE EXECUTE ON FUNCTION public.get_waitlist_growth(text) FROM anon;

CREATE OR REPLACE FUNCTION public.get_waitlist_growth(timeframe text)
RETURNS TABLE(period text, signups bigint, growth_rate numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH grouped AS (
    SELECT
      CASE
        WHEN timeframe = 'hour' THEN to_char(created_at, 'YYYY-MM-DD HH24:00')
        WHEN timeframe = 'day' THEN to_char(created_at, 'YYYY-MM-DD')
        WHEN timeframe = 'week' THEN to_char(date_trunc('week', created_at), 'YYYY-MM-DD')
        WHEN timeframe = 'month' THEN to_char(created_at, 'YYYY-MM')
        WHEN timeframe = 'year' THEN to_char(created_at, 'YYYY')
        ELSE to_char(created_at, 'YYYY-MM-DD')
      END AS p,
      COUNT(*) AS s
    FROM public.waitlist_signups
    GROUP BY p
    ORDER BY p
  ),
  with_growth AS (
    SELECT
      g.p,
      g.s,
      CASE WHEN LAG(g.s) OVER (ORDER BY g.p) > 0
        THEN ROUND(((g.s - LAG(g.s) OVER (ORDER BY g.p))::numeric / LAG(g.s) OVER (ORDER BY g.p)) * 100, 1)
        ELSE 0
      END AS gr
    FROM grouped g
  )
  SELECT wg.p, wg.s, wg.gr FROM with_growth wg;
END;
$$;

-- 2. Fix profiles RLS policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Restrict referral_leaderboard view to admin only
ALTER VIEW public.referral_leaderboard SET (security_invoker = on);
REVOKE ALL ON public.referral_leaderboard FROM anon;
REVOKE ALL ON public.referral_leaderboard FROM authenticated;
GRANT SELECT ON public.referral_leaderboard TO authenticated;

-- 4. Create used_payment_references table for replay protection
CREATE TABLE public.used_payment_references (
  reference text PRIMARY KEY,
  user_id uuid NOT NULL,
  tier text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.used_payment_references ENABLE ROW LEVEL SECURITY;
