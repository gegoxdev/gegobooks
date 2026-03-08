
-- View: total_waitlist_users
CREATE OR REPLACE VIEW public.total_waitlist_users AS
SELECT COUNT(*)::integer AS total FROM public.waitlist_signups;

-- View: todays_signups
CREATE OR REPLACE VIEW public.todays_signups AS
SELECT COUNT(*)::integer AS count FROM public.waitlist_signups WHERE created_at::date = CURRENT_DATE;

-- View: signup_growth_daily
CREATE OR REPLACE VIEW public.signup_growth_daily AS
SELECT created_at::date AS date, COUNT(*)::integer AS signups
FROM public.waitlist_signups
GROUP BY created_at::date
ORDER BY date;

-- View: referral_conversion
CREATE OR REPLACE VIEW public.referral_conversion AS
SELECT
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE referred_by IS NOT NULL)::numeric / COUNT(*)::numeric) * 100, 1)
    ELSE 0
  END AS percentage
FROM public.waitlist_signups;

-- View: user_type_distribution
CREATE OR REPLACE VIEW public.user_type_distribution AS
SELECT user_type, COUNT(*)::integer AS count
FROM public.waitlist_signups
GROUP BY user_type;

-- View: country_distribution (placeholder - no country column yet)
CREATE OR REPLACE VIEW public.country_distribution AS
SELECT 'Nigeria'::text AS country, COUNT(*)::integer AS users
FROM public.waitlist_signups;

-- View: referral_leaderboard
CREATE OR REPLACE VIEW public.referral_leaderboard AS
SELECT full_name, email, referrals_count, referral_code
FROM public.waitlist_signups
WHERE referrals_count > 0
ORDER BY referrals_count DESC
LIMIT 10;

-- View: paid_tier_revenue (placeholder - no payment tracking yet)
CREATE OR REPLACE VIEW public.paid_tier_revenue AS
SELECT 0::numeric AS revenue_ngn;

-- View: growth_comparisons
CREATE OR REPLACE VIEW public.growth_comparisons AS
WITH periods AS (
  SELECT
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::integer AS today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE)::integer AS yesterday,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE))::integer AS this_week,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '1 week' AND created_at < date_trunc('week', CURRENT_DATE))::integer AS last_week,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE))::integer AS this_month,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < date_trunc('month', CURRENT_DATE))::integer AS last_month,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('year', CURRENT_DATE))::integer AS this_year,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('year', CURRENT_DATE) - INTERVAL '1 year' AND created_at < date_trunc('year', CURRENT_DATE))::integer AS last_year
  FROM public.waitlist_signups
)
SELECT
  CASE WHEN yesterday > 0 THEN ROUND(((today - yesterday)::numeric / yesterday) * 100, 1) ELSE 0 END AS dod,
  CASE WHEN last_week > 0 THEN ROUND(((this_week - last_week)::numeric / last_week) * 100, 1) ELSE 0 END AS wow,
  CASE WHEN last_month > 0 THEN ROUND(((this_month - last_month)::numeric / last_month) * 100, 1) ELSE 0 END AS mom,
  CASE WHEN last_year > 0 THEN ROUND(((this_year - last_year)::numeric / last_year) * 100, 1) ELSE 0 END AS yoy
FROM periods;

-- View: waitlist_projection_30d
CREATE OR REPLACE VIEW public.waitlist_projection_30d AS
WITH stats AS (
  SELECT
    COUNT(*)::integer AS current_count,
    CASE WHEN (CURRENT_DATE - MIN(created_at::date)) > 0
      THEN ROUND(COUNT(*)::numeric / GREATEST((CURRENT_DATE - MIN(created_at::date)), 1), 1)
      ELSE COUNT(*)::numeric
    END AS avg_daily_growth
  FROM public.waitlist_signups
)
SELECT
  current_count,
  avg_daily_growth,
  (current_count + (avg_daily_growth * 30))::integer AS projected_30d
FROM stats;

-- Function: get_waitlist_growth(timeframe)
CREATE OR REPLACE FUNCTION public.get_waitlist_growth(timeframe text)
RETURNS TABLE(period text, signups bigint, growth_rate numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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

-- Grant access to views for authenticated users (admin check done in app)
GRANT SELECT ON public.total_waitlist_users TO authenticated;
GRANT SELECT ON public.todays_signups TO authenticated;
GRANT SELECT ON public.signup_growth_daily TO authenticated;
GRANT SELECT ON public.referral_conversion TO authenticated;
GRANT SELECT ON public.user_type_distribution TO authenticated;
GRANT SELECT ON public.country_distribution TO authenticated;
GRANT SELECT ON public.referral_leaderboard TO authenticated;
GRANT SELECT ON public.paid_tier_revenue TO authenticated;
GRANT SELECT ON public.growth_comparisons TO authenticated;
GRANT SELECT ON public.waitlist_projection_30d TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_growth(text) TO authenticated;

-- Enable realtime for waitlist_signups
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist_signups;
