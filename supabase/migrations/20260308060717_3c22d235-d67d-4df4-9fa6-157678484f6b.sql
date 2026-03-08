
-- Fix security definer views by setting them to SECURITY INVOKER
ALTER VIEW public.total_waitlist_users SET (security_invoker = on);
ALTER VIEW public.todays_signups SET (security_invoker = on);
ALTER VIEW public.signup_growth_daily SET (security_invoker = on);
ALTER VIEW public.referral_conversion SET (security_invoker = on);
ALTER VIEW public.user_type_distribution SET (security_invoker = on);
ALTER VIEW public.country_distribution SET (security_invoker = on);
ALTER VIEW public.referral_leaderboard SET (security_invoker = on);
ALTER VIEW public.paid_tier_revenue SET (security_invoker = on);
ALTER VIEW public.growth_comparisons SET (security_invoker = on);
ALTER VIEW public.waitlist_projection_30d SET (security_invoker = on);

-- Also grant to anon for the views (needed for RLS bypass since views check invoker's permissions)
GRANT SELECT ON public.total_waitlist_users TO anon;
GRANT SELECT ON public.todays_signups TO anon;
GRANT SELECT ON public.signup_growth_daily TO anon;
GRANT SELECT ON public.referral_conversion TO anon;
GRANT SELECT ON public.user_type_distribution TO anon;
GRANT SELECT ON public.country_distribution TO anon;
GRANT SELECT ON public.referral_leaderboard TO anon;
GRANT SELECT ON public.paid_tier_revenue TO anon;
GRANT SELECT ON public.growth_comparisons TO anon;
GRANT SELECT ON public.waitlist_projection_30d TO anon;
GRANT EXECUTE ON FUNCTION public.get_waitlist_growth(text) TO anon;
