
-- Drop custom OTP tables and functions
DROP TABLE IF EXISTS public.admin_otps;
DROP FUNCTION IF EXISTS public.create_admin_otp(text);
DROP FUNCTION IF EXISTS public.verify_admin_otp(text, text);
DROP FUNCTION IF EXISTS public.is_admin_email(text);
DROP FUNCTION IF EXISTS public.link_admin_user(text, uuid);
DROP FUNCTION IF EXISTS public.admin_remove_admin_by_email(text);

-- Restore admin_users: make user_id NOT NULL again, drop email column
-- First remove admins without user_id (not yet signed in)
DELETE FROM public.admin_users WHERE user_id IS NULL;

-- Drop the email unique constraint
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_email_unique;
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS email;
ALTER TABLE public.admin_users ALTER COLUMN user_id SET NOT NULL;

-- Restore original admin_add_admin (requires existing auth account)
CREATE OR REPLACE FUNCTION public.admin_add_admin(target_email text, admin_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('master') THEN
    RAISE EXCEPTION 'Only master admins can directly add admins';
  END IF;

  IF admin_role NOT IN ('readonly', 'approver', 'admin', 'master') THEN
    RAISE EXCEPTION 'Invalid role: %', admin_role;
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = lower(target_email);
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user account found for email: %', target_email;
  END IF;

  INSERT INTO public.admin_users (user_id, role)
  VALUES (target_user_id, admin_role)
  ON CONFLICT (user_id) DO UPDATE SET role = admin_role;
END;
$$;

-- Restore original admin_list_admins
CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE(admin_id uuid, user_id uuid, email text, role text, created_at timestamp with time zone, full_name text, tier text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT a.id, a.user_id, u.email, a.role, a.created_at,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(p.tier, 'free') AS tier
  FROM public.admin_users a
  JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN public.profiles p ON p.user_id = a.user_id AND p.deleted_at IS NULL
  ORDER BY a.created_at;
END;
$$;

-- Restore original admin_remove_admin
CREATE OR REPLACE FUNCTION public.admin_remove_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
  target_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can remove admins';
  END IF;

  SELECT role INTO target_role FROM public.admin_users WHERE user_id = target_user_id;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = target_user_id;
END;
$$;
