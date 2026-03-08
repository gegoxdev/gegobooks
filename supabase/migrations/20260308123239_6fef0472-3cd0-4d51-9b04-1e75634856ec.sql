-- Fix admin RPC return type mismatches caused by auth.users.email being varchar(255)
-- Cast auth email columns to text in all table-returning functions.

CREATE OR REPLACE FUNCTION public.list_admin_invites()
RETURNS TABLE(
  id uuid,
  email text,
  role text,
  invited_by_email text,
  status text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  token text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    ai.id,
    ai.email,
    ai.role,
    u.email::text AS invited_by_email,
    ai.status,
    ai.created_at,
    ai.expires_at,
    ai.token
  FROM public.admin_invites ai
  JOIN auth.users u ON u.id = ai.invited_by
  ORDER BY ai.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE(
  admin_id uuid,
  user_id uuid,
  email text,
  role text,
  created_at timestamp with time zone,
  full_name text,
  tier text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    u.email::text AS email,
    a.role,
    a.created_at,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(p.tier, 'free') AS tier
  FROM public.admin_users a
  JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN public.profiles p ON p.user_id = a.user_id AND p.deleted_at IS NULL
  ORDER BY a.created_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_my_admin_invite()
RETURNS TABLE(
  id uuid,
  role text,
  invited_by_email text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_email text;
BEGIN
  SELECT au.email::text INTO caller_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  RETURN QUERY
  SELECT
    ai.id,
    ai.role,
    u.email::text AS invited_by_email,
    ai.created_at
  FROM public.admin_invites ai
  JOIN auth.users u ON u.id = ai.invited_by
  WHERE ai.email = lower(caller_email)
    AND ai.status = 'pending'
    AND ai.expires_at > now()
  LIMIT 1;
END;
$function$;