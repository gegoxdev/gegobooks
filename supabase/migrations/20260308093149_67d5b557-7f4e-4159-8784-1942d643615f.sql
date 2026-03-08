-- Create admin invites table
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'readonly',
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 32)),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can read invites
CREATE POLICY "Admins can read invites" ON public.admin_invites
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Update admin_add_admin to support approver role
CREATE OR REPLACE FUNCTION public.admin_add_admin(target_email text, admin_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function to create an admin invite
CREATE OR REPLACE FUNCTION public.create_admin_invite(target_email text, invite_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  invite_token text;
  role_hierarchy jsonb := '{"readonly": 0, "approver": 1, "admin": 2, "master": 3}'::jsonb;
  caller_rank integer;
  invite_rank integer;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  
  IF caller_role IS NULL OR caller_role NOT IN ('master', 'approver') THEN
    RAISE EXCEPTION 'Only master admins and approvers can send invites';
  END IF;

  IF invite_role NOT IN ('readonly', 'approver', 'admin', 'master') THEN
    RAISE EXCEPTION 'Invalid role: %', invite_role;
  END IF;

  caller_rank := (role_hierarchy ->> caller_role)::integer;
  invite_rank := (role_hierarchy ->> invite_role)::integer;

  -- Approvers can only invite up to their own level, master can invite any
  IF caller_role != 'master' AND invite_rank > caller_rank THEN
    RAISE EXCEPTION 'Cannot invite someone to a higher role than your own';
  END IF;

  -- Check if already an admin
  IF EXISTS (
    SELECT 1 FROM public.admin_users a
    JOIN auth.users u ON u.id = a.user_id
    WHERE u.email = lower(target_email)
  ) THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;

  -- Revoke any existing pending invites for this email
  UPDATE public.admin_invites SET status = 'revoked'
  WHERE email = lower(target_email) AND status = 'pending';

  -- Create new invite
  INSERT INTO public.admin_invites (email, role, invited_by)
  VALUES (lower(target_email), invite_role, auth.uid())
  RETURNING token INTO invite_token;

  RETURN invite_token;
END;
$$;

-- Function to accept an invite (by token)
CREATE OR REPLACE FUNCTION public.accept_admin_invite(invite_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  caller_email text;
BEGIN
  SELECT au.email INTO caller_email FROM auth.users au WHERE au.id = auth.uid();
  
  SELECT * INTO inv FROM public.admin_invites
  WHERE token = invite_token AND status = 'pending' AND expires_at > now();

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF inv.email != lower(caller_email) THEN
    RAISE EXCEPTION 'This invite is not for your email address';
  END IF;

  -- Add as admin
  INSERT INTO public.admin_users (user_id, role)
  VALUES (auth.uid(), inv.role)
  ON CONFLICT (user_id) DO UPDATE SET role = inv.role;

  -- Mark invite as accepted
  UPDATE public.admin_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;
END;
$$;

-- Function to list invites
CREATE OR REPLACE FUNCTION public.list_admin_invites()
RETURNS TABLE(id uuid, email text, role text, invited_by_email text, status text, created_at timestamptz, expires_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT ai.id, ai.email, ai.role, u.email AS invited_by_email, ai.status, ai.created_at, ai.expires_at
  FROM public.admin_invites ai
  JOIN auth.users u ON u.id = ai.invited_by
  ORDER BY ai.created_at DESC;
END;
$$;

-- Function to revoke an invite
CREATE OR REPLACE FUNCTION public.revoke_admin_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('master', 'approver') THEN
    RAISE EXCEPTION 'Only master admins and approvers can revoke invites';
  END IF;

  UPDATE public.admin_invites SET status = 'revoked' WHERE id = invite_id AND status = 'pending';
END;
$$;

-- Function to check pending invite for current user
CREATE OR REPLACE FUNCTION public.check_my_admin_invite()
RETURNS TABLE(id uuid, role text, invited_by_email text, created_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
BEGIN
  SELECT au.email INTO caller_email FROM auth.users au WHERE au.id = auth.uid();
  
  RETURN QUERY
  SELECT ai.id, ai.role, u.email AS invited_by_email, ai.created_at
  FROM public.admin_invites ai
  JOIN auth.users u ON u.id = ai.invited_by
  WHERE ai.email = lower(caller_email) AND ai.status = 'pending' AND ai.expires_at > now()
  LIMIT 1;
END;
$$;

-- Update admin_list_admins to include approver
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

-- Update admin_remove_admin to work with new roles
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
    RAISE EXCEPTION 'Only master admins can remove admins';
  END IF;

  SELECT role INTO target_role FROM public.admin_users WHERE user_id = target_user_id;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = target_user_id;
END;
$$;