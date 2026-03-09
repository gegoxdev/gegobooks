
-- Challenge weeks / themes
CREATE TABLE public.challenge_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  theme text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  prize_amount integer NOT NULL DEFAULT 20000,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Challenge submissions
CREATE TABLE public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_week_id uuid NOT NULL REFERENCES public.challenge_weeks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  content_url text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  caption text,
  status text NOT NULL DEFAULT 'pending',
  is_weekly_winner boolean NOT NULL DEFAULT false,
  is_monthly_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Challenge notifications
CREATE TABLE public.challenge_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_global boolean NOT NULL DEFAULT false,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_challenge_weeks_status ON public.challenge_weeks(status);
CREATE INDEX idx_challenge_submissions_week ON public.challenge_submissions(challenge_week_id);
CREATE INDEX idx_challenge_submissions_user ON public.challenge_submissions(user_id);
CREATE INDEX idx_challenge_notifications_user ON public.challenge_notifications(user_id);

-- Enable RLS
ALTER TABLE public.challenge_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: challenge_weeks - anyone can read active/published, admins can manage
CREATE POLICY "Anyone can read published challenges"
  ON public.challenge_weeks FOR SELECT TO anon, authenticated
  USING (status IN ('active', 'completed'));

CREATE POLICY "Admins can read all challenges"
  ON public.challenge_weeks FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert challenges"
  ON public.challenge_weeks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update challenges"
  ON public.challenge_weeks FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete challenges"
  ON public.challenge_weeks FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- RLS: challenge_submissions
CREATE POLICY "Users can read own submissions"
  ON public.challenge_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all submissions"
  ON public.challenge_submissions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can submit"
  ON public.challenge_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update submissions"
  ON public.challenge_submissions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- RLS: challenge_notifications
CREATE POLICY "Users can read own notifications"
  ON public.challenge_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "Admins can manage notifications"
  ON public.challenge_notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own notification read status"
  ON public.challenge_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- View: challenge leaderboard (top submissions by week)
CREATE OR REPLACE VIEW public.challenge_leaderboard AS
SELECT
  cs.user_name,
  cs.user_email,
  COUNT(*) AS total_submissions,
  COUNT(*) FILTER (WHERE cs.is_weekly_winner) AS weekly_wins,
  COUNT(*) FILTER (WHERE cs.is_monthly_winner) AS monthly_wins,
  COUNT(*) FILTER (WHERE cs.status = 'approved') AS approved_submissions
FROM public.challenge_submissions cs
WHERE cs.status IN ('approved', 'pending')
GROUP BY cs.user_name, cs.user_email
ORDER BY weekly_wins DESC, approved_submissions DESC;

-- Function: get current active challenge
CREATE OR REPLACE FUNCTION public.get_active_challenge()
RETURNS TABLE(
  id uuid, title text, description text, theme text,
  start_date date, end_date date, status text, prize_amount integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cw.id, cw.title, cw.description, cw.theme, cw.start_date, cw.end_date, cw.status, cw.prize_amount
  FROM public.challenge_weeks cw
  WHERE cw.status = 'active' AND CURRENT_DATE BETWEEN cw.start_date AND cw.end_date
  ORDER BY cw.start_date DESC LIMIT 1;
$$;

-- Function: admin select weekly winners
CREATE OR REPLACE FUNCTION public.admin_select_weekly_winner(submission_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.challenge_submissions SET is_weekly_winner = true, status = 'approved', updated_at = now()
  WHERE id = submission_id;
END;
$$;

-- Function: admin select monthly winner
CREATE OR REPLACE FUNCTION public.admin_select_monthly_winner(submission_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.challenge_submissions SET is_monthly_winner = true, status = 'approved', updated_at = now()
  WHERE id = submission_id;
END;
$$;
