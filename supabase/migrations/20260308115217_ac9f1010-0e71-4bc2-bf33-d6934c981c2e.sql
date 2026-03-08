-- Revoke anonymous and public access to sensitive views
REVOKE SELECT ON public.paid_tier_revenue FROM anon, public;
REVOKE SELECT ON public.referral_leaderboard FROM anon, public;

-- Ensure only authenticated users can access (admin check done in app/RPC layer)
GRANT SELECT ON public.paid_tier_revenue TO authenticated;
GRANT SELECT ON public.referral_leaderboard TO authenticated;