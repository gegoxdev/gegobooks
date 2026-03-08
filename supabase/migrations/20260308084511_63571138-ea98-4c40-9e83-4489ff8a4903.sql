
CREATE OR REPLACE FUNCTION public.admin_set_user_tier(target_email text, new_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF new_tier NOT IN ('free', 'priority', 'founder') THEN
    RAISE EXCEPTION 'Invalid tier: %', new_tier;
  END IF;

  -- Update existing profile or do nothing if no profile exists
  UPDATE public.profiles
  SET tier = new_tier
  WHERE lower(email) = lower(target_email) AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found for email: %', target_email;
  END IF;
END;
$$;
