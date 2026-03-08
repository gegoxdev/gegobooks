
-- Create a security definer function to get tier counts (bypasses profiles RLS)
CREATE OR REPLACE FUNCTION public.get_tier_counts()
RETURNS TABLE(tier_id text, tier_label text, max_capacity integer, current_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tl.tier_id,
    tl.tier_label,
    tl.max_capacity,
    COALESCE(pc.cnt, 0)::integer AS current_count
  FROM public.tier_limits tl
  LEFT JOIN (
    SELECT p.tier, COUNT(*)::integer AS cnt
    FROM public.profiles p
    WHERE p.deleted_at IS NULL AND p.tier IS NOT NULL
    GROUP BY p.tier
  ) pc ON pc.tier = tl.tier_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tier_counts() TO authenticated, anon;
