-- Tighten free waitlist insert policy while remaining compatible with BEFORE INSERT trigger
DROP POLICY IF EXISTS "Allow anyone to join free waitlist" ON public.waitlist_signups;

CREATE POLICY "Allow anyone to join free waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) > 0
  AND position('@' in email) > 1
  AND user_type IN ('user', 'accountant', 'both')
);