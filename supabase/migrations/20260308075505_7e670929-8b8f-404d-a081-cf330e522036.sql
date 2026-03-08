
-- Create tier_limits table to track capacity per tier
CREATE TABLE public.tier_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id text NOT NULL UNIQUE,
  tier_label text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

-- Everyone can read tier limits (public info)
CREATE POLICY "Anyone can read tier limits"
  ON public.tier_limits FOR SELECT
  TO authenticated, anon
  USING (true);

-- Insert default tier limits
INSERT INTO public.tier_limits (tier_id, tier_label, max_capacity) VALUES
  ('free', 'Free Waitlist', 999999),
  ('priority', 'Priority Waitlist', 500),
  ('founder', 'Founder Circle', 100);

-- Create a view for tier counts
CREATE OR REPLACE VIEW public.tier_counts AS
SELECT
  tl.tier_id,
  tl.tier_label,
  tl.max_capacity,
  COALESCE(pc.count, 0)::integer AS current_count
FROM public.tier_limits tl
LEFT JOIN (
  SELECT tier, COUNT(*)::integer AS count
  FROM public.profiles
  WHERE deleted_at IS NULL
  GROUP BY tier
) pc ON pc.tier = tl.tier_id;

-- Grant select on the view
GRANT SELECT ON public.tier_counts TO authenticated, anon;

-- Create upgrade function with downgrade prevention
CREATE OR REPLACE FUNCTION public.upgrade_tier(new_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_tier text;
  tier_hierarchy jsonb := '{"free": 0, "priority": 1, "founder": 2}'::jsonb;
  current_rank integer;
  new_rank integer;
BEGIN
  -- Get current tier
  SELECT tier INTO current_user_tier
  FROM public.profiles
  WHERE user_id = auth.uid() AND deleted_at IS NULL;

  IF current_user_tier IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Get ranks
  current_rank := COALESCE((tier_hierarchy ->> current_user_tier)::integer, 0);
  new_rank := (tier_hierarchy ->> new_tier)::integer;

  IF new_rank IS NULL THEN
    RAISE EXCEPTION 'Invalid tier: %', new_tier;
  END IF;

  -- Prevent downgrade
  IF new_rank <= current_rank THEN
    RAISE EXCEPTION 'Cannot downgrade tier. Current: %, Requested: %', current_user_tier, new_tier;
  END IF;

  -- Upgrade
  UPDATE public.profiles
  SET tier = new_tier
  WHERE user_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.upgrade_tier(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upgrade_tier(text) FROM anon;
