
-- Fix security definer view by making it invoker-based
DROP VIEW IF EXISTS public.tier_counts;

CREATE OR REPLACE VIEW public.tier_counts
WITH (security_invoker = true)
AS
SELECT
  tl.tier_id,
  tl.tier_label,
  tl.max_capacity,
  COALESCE(pc.count, 0)::integer AS current_count
FROM public.tier_limits tl
LEFT JOIN (
  SELECT tier, COUNT(*)::integer AS count
  FROM public.profiles
  WHERE deleted_at IS NULL
  GROUP BY tier
) pc ON pc.tier = tl.tier_id;

GRANT SELECT ON public.tier_counts TO authenticated, anon;
