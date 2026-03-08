
-- Admin function to delete a waitlist signup and rerank positions
CREATE OR REPLACE FUNCTION public.admin_delete_waitlist_signup(signup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_position integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT waitlist_position INTO deleted_position
  FROM public.waitlist_signups WHERE id = signup_id;

  IF deleted_position IS NULL THEN
    RAISE EXCEPTION 'Signup not found';
  END IF;

  DELETE FROM public.waitlist_signups WHERE id = signup_id;

  UPDATE public.waitlist_signups
  SET waitlist_position = waitlist_position - 1
  WHERE waitlist_position > deleted_position;
END;
$$;

-- Admin function to delete a user account
CREATE OR REPLACE FUNCTION public.admin_delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Soft-delete column for user self-deletion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- User requests account deletion (soft-delete, 30-day retention)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET deleted_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

-- User cancels account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET deleted_at = NULL
  WHERE user_id = auth.uid();
END;
$$;
