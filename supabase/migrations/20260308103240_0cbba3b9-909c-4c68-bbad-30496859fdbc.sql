
DROP FUNCTION IF EXISTS public.admin_list_admins();

CREATE OR REPLACE FUNCTION public.admin_list_admins()
 RETURNS TABLE(admin_id uuid, user_id uuid, email text, role text, created_at timestamp with time zone, full_name text, tier text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
