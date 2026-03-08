
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anon can insert signup" ON public.waitlist_signups;

CREATE POLICY "Anon can insert signup"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (waitlist_position IS NULL)
  AND (referrals_count = 0)
  AND (referral_code IS NULL)
);
