
-- Fix security definer views by setting them to SECURITY INVOKER explicitly
ALTER VIEW public.arpu SET (security_invoker = on);
ALTER VIEW public.paid_conversion_rate SET (security_invoker = on);
ALTER VIEW public.avg_referrals_per_user SET (security_invoker = on);
ALTER VIEW public.signup_source_breakdown SET (security_invoker = on);
ALTER VIEW public.churn_rate SET (security_invoker = on);
ALTER VIEW public.tier_upgrade_funnel SET (security_invoker = on);
ALTER VIEW public.signups_by_day_of_week SET (security_invoker = on);

-- Also fix pre-existing views that have same issue
ALTER VIEW public.total_waitlist_users SET (security_invoker = on);
ALTER VIEW public.todays_signups SET (security_invoker = on);
ALTER VIEW public.referral_conversion SET (security_invoker = on);
ALTER VIEW public.paid_tier_revenue SET (security_invoker = on);
ALTER VIEW public.growth_comparisons SET (security_invoker = on);
ALTER VIEW public.user_type_distribution SET (security_invoker = on);
ALTER VIEW public.country_distribution SET (security_invoker = on);
ALTER VIEW public.referral_leaderboard SET (security_invoker = on);
ALTER VIEW public.signup_growth_daily SET (security_invoker = on);
ALTER VIEW public.waitlist_projection_30d SET (security_invoker = on);
ALTER VIEW public.tier_counts SET (security_invoker = on);
