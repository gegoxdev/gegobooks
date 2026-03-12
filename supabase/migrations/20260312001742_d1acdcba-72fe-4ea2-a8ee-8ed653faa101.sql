
-- Add business info columns to waitlist_signups
ALTER TABLE public.waitlist_signups 
  ADD COLUMN IF NOT EXISTS business_registered boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_type text DEFAULT NULL;

-- Create a function to validate referral codes
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.waitlist_signups WHERE referral_code = upper(p_code)
  );
$$;
