CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN '{}'::json;
  END IF;

  SELECT json_build_object(
    'total_accounts', (SELECT COUNT(*) FROM auth.users),
    'confirmed_accounts', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'unconfirmed_accounts', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL),
    'accounts_today', (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE),
    'accounts_this_week', (SELECT COUNT(*) FROM auth.users WHERE created_at >= date_trunc('week', CURRENT_DATE)),
    'accounts_this_month', (SELECT COUNT(*) FROM auth.users WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'last_sign_in_24h', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '24 hours'),
    'last_sign_in_7d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '7 days'),
    'never_signed_in', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at IS NULL AND email_confirmed_at IS NOT NULL)
  ) INTO result;

  RETURN result;
END;
$$;