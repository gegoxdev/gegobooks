
-- 1. CRITICAL SECURITY FIX: Restrict profile self-update to only safe columns (prevent users setting own tier)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier IS NOT DISTINCT FROM (SELECT p.tier FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 2. Add RLS to used_payment_references (no direct access)
ALTER TABLE public.used_payment_references ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS to viewer_links
ALTER TABLE public.viewer_links ENABLE ROW LEVEL SECURITY;

-- 4. Create investor-grade views

CREATE OR REPLACE VIEW public.arpu AS
SELECT
  CASE WHEN COUNT(*) > 0
    THEN ROUND(SUM(CASE WHEN tier = 'priority' THEN 1500 WHEN tier = 'founder' THEN 15000 ELSE 0 END)::numeric / COUNT(*)::numeric, 2)
    ELSE 0
  END AS arpu_ngn
FROM public.profiles
WHERE tier IN ('priority', 'founder') AND deleted_at IS NULL;

CREATE OR REPLACE VIEW public.paid_conversion_rate AS
SELECT
  CASE WHEN (SELECT COUNT(*) FROM public.waitlist_signups) > 0
    THEN ROUND(
      (SELECT COUNT(*) FROM public.profiles WHERE tier IN ('priority', 'founder') AND deleted_at IS NULL)::numeric
      / (SELECT COUNT(*) FROM public.waitlist_signups)::numeric * 100, 2
    )
    ELSE 0
  END AS conversion_pct,
  (SELECT COUNT(*) FROM public.profiles WHERE tier IN ('priority', 'founder') AND deleted_at IS NULL) AS paid_users,
  (SELECT COUNT(*) FROM public.waitlist_signups) AS total_signups;

CREATE OR REPLACE VIEW public.avg_referrals_per_user AS
SELECT
  CASE WHEN COUNT(*) > 0
    THEN ROUND(AVG(referrals_count)::numeric, 2)
    ELSE 0
  END AS avg_referrals,
  SUM(referrals_count) AS total_referrals,
  COUNT(*) FILTER (WHERE referrals_count > 0) AS users_with_referrals
FROM public.waitlist_signups;

CREATE OR REPLACE VIEW public.signup_source_breakdown AS
SELECT
  COALESCE(NULLIF(utm_source, ''), 'direct') AS source,
  COUNT(*) AS signups,
  ROUND(COUNT(*)::numeric / GREATEST((SELECT COUNT(*) FROM public.waitlist_signups), 1)::numeric * 100, 1) AS percentage
FROM public.waitlist_signups
GROUP BY COALESCE(NULLIF(utm_source, ''), 'direct')
ORDER BY signups DESC;

CREATE OR REPLACE VIEW public.churn_rate AS
SELECT
  CASE WHEN (SELECT COUNT(*) FROM public.profiles) > 0
    THEN ROUND(
      (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NOT NULL)::numeric
      / (SELECT COUNT(*) FROM public.profiles)::numeric * 100, 2
    )
    ELSE 0
  END AS churn_pct,
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NOT NULL) AS deletion_requests;

CREATE OR REPLACE VIEW public.tier_upgrade_funnel AS
SELECT
  tier,
  COUNT(*) AS users,
  ROUND(COUNT(*)::numeric / GREATEST((SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL), 1)::numeric * 100, 1) AS percentage
FROM public.profiles
WHERE deleted_at IS NULL
GROUP BY tier
ORDER BY
  CASE tier WHEN 'free' THEN 0 WHEN 'priority' THEN 1 WHEN 'founder' THEN 2 ELSE 3 END;

CREATE OR REPLACE VIEW public.signups_by_day_of_week AS
SELECT
  to_char(created_at, 'Dy') AS day_name,
  EXTRACT(DOW FROM created_at)::integer AS day_num,
  COUNT(*) AS signups
FROM public.waitlist_signups
GROUP BY day_name, day_num
ORDER BY day_num;
