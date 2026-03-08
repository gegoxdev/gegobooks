
-- Add email column to admin_users so we can add admins by email before they have an account
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.admin_users ALTER COLUMN user_id DROP NOT NULL;

-- Populate email from auth.users for existing records
UPDATE public.admin_users SET email = u.email
FROM auth.users u WHERE u.id = admin_users.user_id AND admin_users.email IS NULL;

-- Add unique constraint on email
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_email_unique UNIQUE (email);

-- Function to check if an email is in the admin list
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE lower(email) = lower(check_email)
  )
$$;

-- Update admin_add_admin to work without requiring an existing auth account
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
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can add admins';
  END IF;

  IF admin_role NOT IN ('readonly', 'approver', 'admin', 'master') THEN
    RAISE EXCEPTION 'Invalid role: %', admin_role;
  END IF;

  -- Check if already an admin
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(target_email)) THEN
    -- Update role instead
    UPDATE public.admin_users SET role = admin_role WHERE lower(email) = lower(target_email);
    RETURN;
  END IF;

  -- Try to find existing user
  SELECT id INTO target_user_id FROM auth.users WHERE email = lower(target_email);

  -- Insert admin record (user_id may be null if no account yet)
  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (target_user_id, lower(target_email), admin_role);
END;
$$;

-- Function to link user_id when admin signs in for the first time
CREATE OR REPLACE FUNCTION public.link_admin_user(admin_email text, admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.admin_users
  SET user_id = admin_user_id
  WHERE lower(email) = lower(admin_email) AND user_id IS NULL;
END;
$$;

-- Update admin_list_admins to handle null user_id
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
  SELECT a.id, a.user_id, 
    COALESCE(a.email, u.email) AS email,
    a.role, a.created_at,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(p.tier, 'free') AS tier
  FROM public.admin_users a
  LEFT JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN public.profiles p ON p.user_id = a.user_id AND p.deleted_at IS NULL
  ORDER BY a.created_at;
END;
$$;

-- Update admin_remove_admin to work with email-based admins too
CREATE OR REPLACE FUNCTION public.admin_remove_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can remove admins';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = target_user_id;
END;
$$;

-- New function to remove admin by email (for admins without user_id)
CREATE OR REPLACE FUNCTION public.admin_remove_admin_by_email(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can remove admins';
  END IF;

  DELETE FROM public.admin_users WHERE lower(email) = lower(target_email);
END;
$$;

-- Update is_admin to also check by email for linked admins
-- Keep existing behavior for user_id based checks

-- Update Admin page check to work with the new flow
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.admin_users WHERE user_id = _user_id LIMIT 1;
$$;
