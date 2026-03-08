-- Fix free waitlist inserts: previous WITH CHECK conflicted with BEFORE INSERT trigger values
DROP POLICY IF EXISTS "Anon can insert signup" ON public.waitlist_signups;

CREATE POLICY "Allow anyone to join free waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);