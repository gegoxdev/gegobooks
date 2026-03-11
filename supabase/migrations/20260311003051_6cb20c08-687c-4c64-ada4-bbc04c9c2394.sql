
-- 1. Add scoring columns to challenge_submissions
ALTER TABLE public.challenge_submissions 
  ADD COLUMN IF NOT EXISTS score_engagement integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_creativity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_theme_clarity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score numeric DEFAULT 0;

-- 2. Add configurable prize settings to challenge_settings
ALTER TABLE public.challenge_settings
  ADD COLUMN IF NOT EXISTS weekly_prize_amount integer DEFAULT 20000,
  ADD COLUMN IF NOT EXISTS weekly_winner_count integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS monthly_prize_amount integer DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS monthly_winner_count integer DEFAULT 1;

UPDATE public.challenge_settings SET
  weekly_prize_amount = 20000,
  weekly_winner_count = 5,
  monthly_prize_amount = 100000,
  monthly_winner_count = 1
WHERE id = 'global';

-- 3. Add attachment support to challenge_weeks
ALTER TABLE public.challenge_weeks
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- 4. Dynamic waitlist position function (tier-based priority ranking)
CREATE OR REPLACE FUNCTION public.get_dynamic_waitlist_position(p_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ranked.pos, 0)::integer
  FROM (
    SELECT ws.email, ROW_NUMBER() OVER (
      ORDER BY 
        CASE COALESCE(p.tier, 'free')
          WHEN 'founder' THEN 0
          WHEN 'priority' THEN 1
          ELSE 2
        END ASC,
        ws.referrals_count DESC,
        ws.created_at ASC
    )::integer as pos
    FROM public.waitlist_signups ws
    LEFT JOIN public.profiles p ON lower(p.email) = lower(ws.email) AND p.deleted_at IS NULL
  ) ranked
  WHERE ranked.email = lower(p_email);
$$;

-- 5. Update get_my_waitlist_status to use dynamic position
CREATE OR REPLACE FUNCTION public.get_my_waitlist_status()
RETURNS TABLE(full_name text, email text, waitlist_position integer, referrals_count integer, referral_code text, user_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT au.email INTO user_email FROM auth.users au WHERE au.id = auth.uid();
  RETURN QUERY
    SELECT ws.full_name, ws.email,
      public.get_dynamic_waitlist_position(ws.email) as waitlist_position,
      ws.referrals_count, ws.referral_code, ws.user_type
    FROM public.waitlist_signups ws
    WHERE ws.email = user_email
    LIMIT 1;
END;
$$;

-- 6. Update get_my_signup to use dynamic position
CREATE OR REPLACE FUNCTION public.get_my_signup(p_email text)
RETURNS TABLE(waitlist_position integer, referrals_count integer, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT public.get_dynamic_waitlist_position(ws.email) as waitlist_position,
      ws.referrals_count, ws.referral_code
    FROM public.waitlist_signups ws
    WHERE ws.email = lower(p_email)
      AND ws.created_at >= (now() - interval '5 minutes')
    LIMIT 1;
END;
$$;

-- 7. Update admin signups function to use dynamic position
CREATE OR REPLACE FUNCTION public.get_admin_signups_with_tiers()
RETURNS TABLE(id uuid, full_name text, email text, user_type text, referral_code text, referrals_count integer, referred_by text, waitlist_position integer, created_at timestamptz, utm_source text, tier text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT
    ws.id,
    ws.full_name,
    ws.email,
    ws.user_type,
    ws.referral_code,
    ws.referrals_count,
    ws.referred_by,
    public.get_dynamic_waitlist_position(ws.email) as waitlist_position,
    ws.created_at,
    ws.utm_source,
    COALESCE(p.tier, 'free') AS tier
  FROM public.waitlist_signups ws
  LEFT JOIN public.profiles p ON lower(p.email) = lower(ws.email) AND p.deleted_at IS NULL
  ORDER BY 
    CASE COALESCE(p.tier, 'free')
      WHEN 'founder' THEN 0
      WHEN 'priority' THEN 1
      ELSE 2
    END ASC,
    ws.referrals_count DESC,
    ws.created_at ASC;
END;
$$;

-- 8. Admin scoring function
CREATE OR REPLACE FUNCTION public.admin_score_submission(
  p_submission_id uuid,
  p_engagement integer,
  p_creativity integer,
  p_theme_clarity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_score numeric;
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('master', 'challenge_admin') THEN
    RAISE EXCEPTION 'Unauthorized: only master or challenge_admin can score submissions';
  END IF;
  
  IF p_engagement < 0 OR p_engagement > 100 OR p_creativity < 0 OR p_creativity > 100 OR p_theme_clarity < 0 OR p_theme_clarity > 100 THEN
    RAISE EXCEPTION 'Scores must be between 0 and 100';
  END IF;
  
  calculated_score := (p_engagement * 0.3) + (p_creativity * 0.4) + (p_theme_clarity * 0.3);
  
  UPDATE public.challenge_submissions 
  SET score_engagement = p_engagement,
      score_creativity = p_creativity,
      score_theme_clarity = p_theme_clarity,
      total_score = calculated_score,
      updated_at = now()
  WHERE id = p_submission_id;
END;
$$;

-- 9. Public leaderboard function (top 10)
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard()
RETURNS TABLE(user_name text, approved_submissions bigint, weekly_wins bigint, monthly_wins bigint, avg_score numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cs.user_name,
    COUNT(*) FILTER (WHERE cs.status = 'approved') as approved_submissions,
    COUNT(*) FILTER (WHERE cs.is_weekly_winner) as weekly_wins,
    COUNT(*) FILTER (WHERE cs.is_monthly_winner) as monthly_wins,
    COALESCE(ROUND(AVG(cs.total_score) FILTER (WHERE cs.total_score > 0), 1), 0) as avg_score
  FROM public.challenge_submissions cs
  GROUP BY cs.user_name
  HAVING COUNT(*) FILTER (WHERE cs.status = 'approved') > 0
  ORDER BY weekly_wins DESC, monthly_wins DESC, avg_score DESC
  LIMIT 10;
$$;

-- 10. Update challenge leaderboard view to include scores
DROP VIEW IF EXISTS public.challenge_leaderboard;
CREATE VIEW public.challenge_leaderboard WITH (security_invoker = true) AS
SELECT 
  cs.user_name,
  cs.user_email,
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE cs.status = 'approved') as approved_submissions,
  COUNT(*) FILTER (WHERE cs.is_weekly_winner) as weekly_wins,
  COUNT(*) FILTER (WHERE cs.is_monthly_winner) as monthly_wins,
  COALESCE(ROUND(AVG(cs.total_score) FILTER (WHERE cs.total_score > 0), 1), 0) as avg_score
FROM public.challenge_submissions cs
GROUP BY cs.user_name, cs.user_email
ORDER BY weekly_wins DESC, monthly_wins DESC, avg_score DESC;

-- 11. Update waitlist signup trigger - referrals only increment count, position is dynamic
CREATE OR REPLACE FUNCTION public.handle_waitlist_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  referrer_id uuid;
BEGIN
  NEW.waitlist_position := (SELECT COUNT(*) + 1 FROM public.waitlist_signups);

  LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.waitlist_signups WHERE referral_code = new_code);
  END LOOP;
  NEW.referral_code := new_code;

  IF NEW.referred_by IS NOT NULL AND NEW.referred_by != '' THEN
    SELECT id INTO referrer_id FROM public.waitlist_signups WHERE referral_code = NEW.referred_by;
    IF referrer_id IS NOT NULL THEN
      UPDATE public.waitlist_signups 
      SET referrals_count = referrals_count + 1
      WHERE id = referrer_id;
    ELSE
      NEW.referred_by := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 12. Update admin_delete_waitlist_signup - no manual reranking needed
CREATE OR REPLACE FUNCTION public.admin_delete_waitlist_signup(signup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Insufficient role: only admin or master can delete signups';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.waitlist_signups WHERE id = signup_id) THEN
    RAISE EXCEPTION 'Signup not found';
  END IF;
  DELETE FROM public.waitlist_signups WHERE id = signup_id;
END;
$$;

-- 13. Update admin_add_admin to support challenge_admin role
CREATE OR REPLACE FUNCTION public.admin_add_admin(target_email text, admin_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('master') THEN
    RAISE EXCEPTION 'Only master admins can directly add admins';
  END IF;

  IF admin_role NOT IN ('readonly', 'approver', 'admin', 'master', 'challenge_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', admin_role;
  END IF;

  IF lower(target_email) = 'gegobooks@gmail.com' AND admin_role != 'master' THEN
    RAISE EXCEPTION 'This admin account is permanently protected and cannot be downgraded';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = lower(target_email);
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user account found for email: %', target_email;
  END IF;

  INSERT INTO public.admin_users (user_id, role)
  VALUES (target_user_id, admin_role)
  ON CONFLICT (user_id) DO UPDATE SET role = admin_role;
END;
$$;

-- 14. Update create_admin_invite to support challenge_admin
CREATE OR REPLACE FUNCTION public.create_admin_invite(target_email text, invite_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  invite_token text;
  role_hierarchy jsonb := '{"readonly": 0, "challenge_admin": 1, "approver": 2, "admin": 3, "master": 4}'::jsonb;
  caller_rank integer;
  invite_rank integer;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  
  IF caller_role IS NULL OR caller_role NOT IN ('master', 'approver') THEN
    RAISE EXCEPTION 'Only master admins and approvers can send invites';
  END IF;

  IF invite_role NOT IN ('readonly', 'approver', 'admin', 'master', 'challenge_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', invite_role;
  END IF;

  caller_rank := (role_hierarchy ->> caller_role)::integer;
  invite_rank := (role_hierarchy ->> invite_role)::integer;

  IF caller_role != 'master' AND invite_rank > caller_rank THEN
    RAISE EXCEPTION 'Cannot invite someone to a higher role than your own';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_users a
    JOIN auth.users u ON u.id = a.user_id
    WHERE u.email = lower(target_email)
  ) THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;

  UPDATE public.admin_invites SET status = 'revoked'
  WHERE email = lower(target_email) AND status = 'pending';

  INSERT INTO public.admin_invites (email, role, invited_by)
  VALUES (lower(target_email), invite_role, auth.uid())
  RETURNING token INTO invite_token;

  RETURN invite_token;
END;
$$;

-- 15. Update admin_select_weekly_winner to restrict to master/challenge_admin
CREATE OR REPLACE FUNCTION public.admin_select_weekly_winner(submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('master', 'challenge_admin') THEN
    RAISE EXCEPTION 'Unauthorized: only master or challenge_admin can select winners';
  END IF;
  UPDATE public.challenge_submissions SET is_weekly_winner = true, status = 'approved', updated_at = now()
  WHERE id = submission_id;
END;
$$;

-- 16. Update admin_select_monthly_winner similarly
CREATE OR REPLACE FUNCTION public.admin_select_monthly_winner(submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('master', 'challenge_admin') THEN
    RAISE EXCEPTION 'Unauthorized: only master or challenge_admin can select winners';
  END IF;
  UPDATE public.challenge_submissions SET is_monthly_winner = true, status = 'approved', updated_at = now()
  WHERE id = submission_id;
END;
$$;

-- 17. Get challenge settings function (public)
CREATE OR REPLACE FUNCTION public.get_challenge_settings()
RETURNS TABLE(coming_soon boolean, weekly_prize_amount integer, weekly_winner_count integer, monthly_prize_amount integer, monthly_winner_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cs.coming_soon, cs.weekly_prize_amount, cs.weekly_winner_count, cs.monthly_prize_amount, cs.monthly_winner_count
  FROM public.challenge_settings cs
  WHERE cs.id = 'global'
  LIMIT 1;
$$;
