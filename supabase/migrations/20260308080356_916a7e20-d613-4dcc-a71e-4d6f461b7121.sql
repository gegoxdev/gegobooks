
-- Function to get signups with their tier from profiles (for admin)
CREATE OR REPLACE FUNCTION public.get_admin_signups_with_tiers()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  user_type text,
  referral_code text,
  referrals_count integer,
  referred_by text,
  waitlist_position integer,
  created_at timestamptz,
  utm_source text,
  tier text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    ws.id,
    ws.full_name,
    ws.email,
    ws.user_type,
    ws.referral_code,
    ws.referrals_count,
    ws.referred_by,
    ws.waitlist_position,
    ws.created_at,
    ws.utm_source,
    COALESCE(p.tier, 'free') AS tier
  FROM public.waitlist_signups ws
  LEFT JOIN public.profiles p ON lower(p.email) = lower(ws.email) AND p.deleted_at IS NULL
  ORDER BY ws.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_signups_with_tiers() TO authenticated;
