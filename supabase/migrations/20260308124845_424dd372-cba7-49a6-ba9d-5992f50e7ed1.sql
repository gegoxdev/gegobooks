
-- 1. Fix admin_delete_user_account: require admin/master role
CREATE OR REPLACE FUNCTION public.admin_delete_user_account(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Insufficient role: only admin or master can delete accounts';
  END IF;

  -- Protect the permanent master admin
  DECLARE target_email text;
  BEGIN
    SELECT u.email::text INTO target_email FROM auth.users u WHERE u.id = target_user_id;
    IF lower(target_email) = 'gegobooks@gmail.com' THEN
      RAISE EXCEPTION 'This account is permanently protected and cannot be deleted';
    END IF;
  END;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$function$;

-- 2. Fix admin_delete_waitlist_signup: require admin/master role
CREATE OR REPLACE FUNCTION public.admin_delete_waitlist_signup(signup_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_position integer;
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Insufficient role: only admin or master can delete signups';
  END IF;

  SELECT waitlist_position INTO deleted_position
  FROM public.waitlist_signups WHERE id = signup_id;

  IF deleted_position IS NULL THEN
    RAISE EXCEPTION 'Signup not found';
  END IF;

  DELETE FROM public.waitlist_signups WHERE id = signup_id;

  UPDATE public.waitlist_signups
  SET waitlist_position = waitlist_position - 1
  WHERE waitlist_position > deleted_position;
END;
$function$;

-- 3. Fix admin_set_user_tier: require admin/master role
CREATE OR REPLACE FUNCTION public.admin_set_user_tier(target_email text, new_tier text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
  current_tier text;
  highest_paid_tier text;
  tier_hierarchy jsonb := '{"free": 0, "priority": 1, "founder": 2}'::jsonb;
  new_rank integer;
  paid_rank integer;
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Insufficient role: only admin or master can change tiers';
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
$function$;

-- 4. Tighten waitlist_signups INSERT policy to prevent position/referral manipulation
DROP POLICY IF EXISTS "Anon can insert signup" ON public.waitlist_signups;
CREATE POLICY "Anon can insert signup" ON public.waitlist_signups
  FOR INSERT
  WITH CHECK (
    waitlist_position IS NULL
    AND referrals_count = 0
    AND referral_code IS NULL
  );
