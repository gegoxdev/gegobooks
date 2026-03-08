-- Drop and recreate get_my_signup with fewer return columns
DROP FUNCTION IF EXISTS public.get_my_signup(text);

CREATE OR REPLACE FUNCTION public.get_my_signup(p_email text)
RETURNS TABLE(waitlist_position int, referrals_count int, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT ws.waitlist_position, ws.referrals_count, ws.referral_code
    FROM public.waitlist_signups ws
    WHERE ws.email = lower(p_email)
    LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_signup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_signup(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_signup(text) TO authenticated;