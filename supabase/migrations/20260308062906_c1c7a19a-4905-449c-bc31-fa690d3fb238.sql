-- 1. Revoke anon SELECT on all admin-only views to prevent PII leakage
REVOKE SELECT ON public.referral_leaderboard FROM anon;
REVOKE SELECT ON public.country_distribution FROM anon;
REVOKE SELECT ON public.growth_comparisons FROM anon;
REVOKE SELECT ON public.paid_tier_revenue FROM anon;
REVOKE SELECT ON public.referral_conversion FROM anon;
REVOKE SELECT ON public.signup_growth_daily FROM anon;
REVOKE SELECT ON public.todays_signups FROM anon;
REVOKE SELECT ON public.total_waitlist_users FROM anon;
REVOKE SELECT ON public.user_type_distribution FROM anon;
REVOKE SELECT ON public.waitlist_projection_30d FROM anon;

-- 2. Add CHECK constraint on user_type
ALTER TABLE public.waitlist_signups
  ADD CONSTRAINT user_type_check
  CHECK (user_type IN ('user', 'accountant', 'both'));

-- 3. Replace get_my_signup with localStorage approach:
-- Instead of removing it entirely, make it return data only for the most recently inserted row
-- by adding a time window check (signup must have happened within last 5 minutes)
DROP FUNCTION IF EXISTS public.get_my_signup(text);

CREATE OR REPLACE FUNCTION public.get_my_signup(p_email text)
RETURNS TABLE(waitlist_position int, referrals_count int, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT ws.waitlist_position, ws.referrals_count, ws.referral_code
    FROM public.waitlist_signups ws
    WHERE ws.email = lower(p_email)
      AND ws.created_at >= (now() - interval '5 minutes')
    LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_signup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_signup(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_signup(text) TO authenticated;