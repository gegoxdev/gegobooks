-- Protect gegobooks@gmail.com as permanent master admin

-- Update admin_remove_admin to block removal of protected admin
CREATE OR REPLACE FUNCTION public.admin_remove_admin(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_role text;
  target_email text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can remove admins';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  SELECT u.email::text INTO target_email FROM auth.users u WHERE u.id = target_user_id;
  IF lower(target_email) = 'gegobooks@gmail.com' THEN
    RAISE EXCEPTION 'This admin account is permanently protected and cannot be removed';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = target_user_id;
END;
$function$;

-- Update admin_add_admin to block downgrading protected admin
CREATE OR REPLACE FUNCTION public.admin_add_admin(target_email text, admin_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Protect gegobooks@gmail.com from any role change other than master
  IF lower(target_email) = 'gegobooks@gmail.com' AND admin_role != 'master' THEN
    RAISE EXCEPTION 'This admin account is permanently protected and cannot be downgraded';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = lower(target_email);
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user account found for email: %', target_email;
  END IF;

  INSERT INTO public.admin_users (user_id, role)
  VALUES (target_user_id, admin_role)
  ON CONFLICT (user_id) DO UPDATE SET role = admin_role;
END;
$function$;