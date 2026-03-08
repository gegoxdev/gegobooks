
-- Update admin_set_user_tier to prevent downgrading below the user's highest paid tier
CREATE OR REPLACE FUNCTION public.admin_set_user_tier(target_email text, new_tier text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  current_tier text;
  highest_paid_tier text;
  tier_hierarchy jsonb := '{"free": 0, "priority": 1, "founder": 2}'::jsonb;
  new_rank integer;
  paid_rank integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF new_tier NOT IN ('free', 'priority', 'founder') THEN
    RAISE EXCEPTION 'Invalid tier: %', new_tier;
  END IF;

  SELECT p.user_id, p.tier INTO target_user_id, current_tier
  FROM public.profiles p
  WHERE lower(p.email) = lower(target_email) AND p.deleted_at IS NULL;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No profile found for email: %', target_email;
  END IF;

  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.used_payment_references r WHERE r.user_id = target_user_id AND r.tier = 'founder') THEN 'founder'
    WHEN EXISTS (SELECT 1 FROM public.used_payment_references r WHERE r.user_id = target_user_id AND r.tier = 'priority') THEN 'priority'
    ELSE 'free'
  END INTO highest_paid_tier;

  new_rank := (tier_hierarchy ->> new_tier)::integer;
  paid_rank := (tier_hierarchy ->> highest_paid_tier)::integer;

  IF new_rank < paid_rank THEN
    RAISE EXCEPTION 'Cannot downgrade below paid tier (%). User paid for this tier.', highest_paid_tier;
  END IF;

  UPDATE public.profiles
  SET tier = new_tier
  WHERE user_id = target_user_id AND deleted_at IS NULL;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
