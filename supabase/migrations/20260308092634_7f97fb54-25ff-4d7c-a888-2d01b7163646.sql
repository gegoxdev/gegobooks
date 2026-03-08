-- Set gegobooks as master admin
UPDATE public.admin_users SET role = 'master' WHERE user_id = '5369d277-cb81-4e80-9f2d-25df2bc226b4';

-- Function to add a new admin
CREATE OR REPLACE FUNCTION public.admin_add_admin(target_email text, admin_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  caller_role text;
  role_hierarchy jsonb := '{"readonly": 0, "admin": 1, "master": 2}'::jsonb;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can manage admins';
  END IF;

  IF admin_role NOT IN ('readonly', 'admin', 'master') THEN
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

-- Function to remove an admin
CREATE OR REPLACE FUNCTION public.admin_remove_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  target_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can manage admins';
  END IF;

  SELECT role INTO target_role FROM public.admin_users WHERE user_id = target_user_id;
  IF target_role = 'master' AND target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove another master admin';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = target_user_id;
END;
$$;

-- Function to list all admins with emails
CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE(admin_id uuid, user_id uuid, email text, role text, created_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT a.id, a.user_id, u.email, a.role, a.created_at
  FROM public.admin_users a
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.created_at;
END;
$$;

-- Add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_user_id_key'
  ) THEN
    ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
  END IF;
END $$;