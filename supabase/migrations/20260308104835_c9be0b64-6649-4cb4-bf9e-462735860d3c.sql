
-- Table to store admin OTP codes
CREATE TABLE public.admin_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

-- RLS: no direct access, all via security definer functions
ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

-- Function to create an admin OTP (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.create_admin_otp(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code text;
BEGIN
  -- Check if email is in admin list
  IF NOT public.is_admin_email(admin_email) THEN
    RAISE EXCEPTION 'Email is not in the admin list';
  END IF;

  -- Invalidate previous OTPs for this email
  UPDATE public.admin_otps SET used = true WHERE lower(email) = lower(admin_email) AND used = false;

  -- Generate 6-digit code
  code := lpad(floor(random() * 1000000)::text, 6, '0');

  INSERT INTO public.admin_otps (email, otp_code)
  VALUES (lower(admin_email), code);

  RETURN code;
END;
$$;

-- Function to verify admin OTP
CREATE OR REPLACE FUNCTION public.verify_admin_otp(admin_email text, otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_otps
    WHERE lower(email) = lower(admin_email)
      AND otp_code = otp
      AND used = false
      AND expires_at > now()
  ) INTO valid;

  IF valid THEN
    -- Mark as used
    UPDATE public.admin_otps
    SET used = true
    WHERE lower(email) = lower(admin_email) AND otp_code = otp;
  END IF;

  RETURN valid;
END;
$$;

-- Cleanup old OTPs periodically (optional, can be done manually)
