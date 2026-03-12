
DROP FUNCTION IF EXISTS public.get_admin_signups_with_tiers();

CREATE OR REPLACE FUNCTION public.get_admin_signups_with_tiers()
RETURNS TABLE(
  id uuid, full_name text, email text, user_type text, referral_code text, 
  referrals_count integer, referred_by text, waitlist_position integer, 
  created_at timestamp with time zone, utm_source text, tier text,
  business_name text, business_type text, business_registered boolean, signup_source text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT
    ws.id, ws.full_name, ws.email, ws.user_type, ws.referral_code,
    ws.referrals_count, ws.referred_by,
    public.get_dynamic_waitlist_position(ws.email) as waitlist_position,
    ws.created_at, ws.utm_source,
    COALESCE(p.tier, 'free') AS tier,
    ws.business_name, ws.business_type, ws.business_registered, ws.signup_source
  FROM public.waitlist_signups ws
  LEFT JOIN public.profiles p ON lower(p.email) = lower(ws.email) AND p.deleted_at IS NULL
  ORDER BY 
    CASE COALESCE(p.tier, 'free')
      WHEN 'founder' THEN 0 WHEN 'priority' THEN 1 ELSE 2
    END ASC,
    ws.referrals_count DESC, ws.created_at ASC;
END;
$$;
