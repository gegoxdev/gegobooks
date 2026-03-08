
DROP FUNCTION IF EXISTS public.list_admin_invites();

CREATE OR REPLACE FUNCTION public.list_admin_invites()
 RETURNS TABLE(id uuid, email text, role text, invited_by_email text, status text, created_at timestamp with time zone, expires_at timestamp with time zone, token text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT ai.id, ai.email, ai.role, u.email AS invited_by_email, ai.status, ai.created_at, ai.expires_at, ai.token
  FROM public.admin_invites ai
  JOIN auth.users u ON u.id = ai.invited_by
  ORDER BY ai.created_at DESC;
END;
$function$;
