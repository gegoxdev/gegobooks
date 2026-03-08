
CREATE OR REPLACE FUNCTION public.get_invite_email(invite_token text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT email FROM public.admin_invites
  WHERE token = invite_token AND status = 'pending' AND expires_at > now()
  LIMIT 1;
$$;
