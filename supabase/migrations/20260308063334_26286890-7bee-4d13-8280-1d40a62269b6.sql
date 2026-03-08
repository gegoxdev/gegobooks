-- Fix security definer views by setting them to SECURITY INVOKER
ALTER VIEW public.referral_leaderboard SET (security_invoker = on);
ALTER VIEW public.country_distribution SET (security_invoker = on);
ALTER VIEW public.growth_comparisons SET (security_invoker = on);
ALTER VIEW public.paid_tier_revenue SET (security_invoker = on);
ALTER VIEW public.referral_conversion SET (security_invoker = on);
ALTER VIEW public.signup_growth_daily SET (security_invoker = on);
ALTER VIEW public.todays_signups SET (security_invoker = on);
ALTER VIEW public.total_waitlist_users SET (security_invoker = on);
ALTER VIEW public.user_type_distribution SET (security_invoker = on);
ALTER VIEW public.waitlist_projection_30d SET (security_invoker = on);