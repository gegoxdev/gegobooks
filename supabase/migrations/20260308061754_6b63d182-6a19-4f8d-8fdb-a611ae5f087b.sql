
-- Drop the overly broad SELECT policy
DROP POLICY IF EXISTS "Anyone can read own signup by email" ON public.waitlist_signups;

-- Create RPC for self-lookup by referral_code (returned from insert trigger)
CREATE OR REPLACE FUNCTION public.get_my_signup(p_email text)
RETURNS TABLE(full_name text, email text, waitlist_position int, referrals_count int, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT ws.full_name, ws.email, ws.waitlist_position, ws.referrals_count, ws.referral_code
    FROM public.waitlist_signups ws
    WHERE ws.email = lower(p_email)
    LIMIT 1;
END;
$$;
