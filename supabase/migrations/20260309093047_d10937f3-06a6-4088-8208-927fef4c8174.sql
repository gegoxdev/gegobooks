
-- Page views / analytics tracking table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  page_path text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  screen_width integer,
  screen_height integer,
  duration_ms integer DEFAULT 0,
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_visitor_id ON public.page_views (visitor_id);
CREATE INDEX idx_page_views_page_path ON public.page_views (page_path);

-- Allow anyone to insert (anonymous tracking)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT
  USING (public.is_admin(auth.uid()));

-- View: traffic overview (today, 7d, 30d)
CREATE OR REPLACE VIEW public.traffic_overview AS
SELECT
  (SELECT COUNT(*) FROM public.page_views WHERE created_at >= CURRENT_DATE) AS views_today,
  (SELECT COUNT(DISTINCT visitor_id) FROM public.page_views WHERE created_at >= CURRENT_DATE) AS visitors_today,
  (SELECT COUNT(*) FROM public.page_views WHERE created_at >= NOW() - INTERVAL '7 days') AS views_7d,
  (SELECT COUNT(DISTINCT visitor_id) FROM public.page_views WHERE created_at >= NOW() - INTERVAL '7 days') AS visitors_7d,
  (SELECT COUNT(*) FROM public.page_views WHERE created_at >= NOW() - INTERVAL '30 days') AS views_30d,
  (SELECT COUNT(DISTINCT visitor_id) FROM public.page_views WHERE created_at >= NOW() - INTERVAL '30 days') AS visitors_30d,
  (SELECT COALESCE(AVG(duration_ms), 0) FROM public.page_views WHERE duration_ms > 0 AND created_at >= NOW() - INTERVAL '7 days') AS avg_duration_ms_7d,
  (SELECT COUNT(DISTINCT session_id) FROM public.page_views WHERE created_at >= NOW() - INTERVAL '7 days') AS sessions_7d;

-- View: traffic by source (referrer domain)
CREATE OR REPLACE VIEW public.traffic_sources AS
SELECT
  COALESCE(
    CASE
      WHEN utm_source IS NOT NULL AND utm_source != '' THEN utm_source
      WHEN referrer IS NOT NULL AND referrer != '' THEN
        CASE
          WHEN referrer LIKE '%google%' THEN 'Google'
          WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'Facebook'
          WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter/X'
          WHEN referrer LIKE '%instagram%' THEN 'Instagram'
          WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
          WHEN referrer LIKE '%whatsapp%' THEN 'WhatsApp'
          WHEN referrer LIKE '%youtube%' THEN 'YouTube'
          ELSE substring(referrer FROM '://([^/]+)')
        END
      ELSE 'Direct'
    END,
    'Direct'
  ) AS source,
  COUNT(*) AS page_views,
  COUNT(DISTINCT visitor_id) AS unique_visitors
FROM public.page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY page_views DESC;

-- View: top pages
CREATE OR REPLACE VIEW public.top_pages AS
SELECT
  page_path,
  COUNT(*) AS views,
  COUNT(DISTINCT visitor_id) AS unique_visitors,
  COALESCE(AVG(NULLIF(duration_ms, 0)), 0)::integer AS avg_duration_ms
FROM public.page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY page_path
ORDER BY views DESC;

-- View: daily page views for chart
CREATE OR REPLACE VIEW public.daily_page_views AS
SELECT
  created_at::date AS date,
  COUNT(*) AS views,
  COUNT(DISTINCT visitor_id) AS visitors
FROM public.page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;

-- View: device breakdown
CREATE OR REPLACE VIEW public.device_breakdown AS
SELECT
  COALESCE(device_type, 'Unknown') AS device_type,
  COUNT(*) AS views,
  COUNT(DISTINCT visitor_id) AS visitors
FROM public.page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY device_type
ORDER BY views DESC;

-- View: browser breakdown
CREATE OR REPLACE VIEW public.browser_breakdown AS
SELECT
  COALESCE(browser, 'Unknown') AS browser,
  COUNT(*) AS views,
  COUNT(DISTINCT visitor_id) AS visitors
FROM public.page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY browser
ORDER BY views DESC;

-- View: hourly traffic pattern
CREATE OR REPLACE VIEW public.hourly_traffic AS
SELECT
  EXTRACT(HOUR FROM created_at)::integer AS hour,
  COUNT(*) AS views,
  COUNT(DISTINCT visitor_id) AS visitors
FROM public.page_views
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;

-- RPC to update duration when user leaves page
CREATE OR REPLACE FUNCTION public.update_page_view_duration(p_id uuid, p_duration_ms integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.page_views SET duration_ms = p_duration_ms WHERE id = p_id;
END;
$$;

-- Bounce rate view (sessions with only 1 page view)
CREATE OR REPLACE VIEW public.bounce_rate AS
SELECT
  COUNT(*) FILTER (WHERE page_count = 1) AS bounced_sessions,
  COUNT(*) AS total_sessions,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE page_count = 1)::numeric / COUNT(*)) * 100, 1)
    ELSE 0
  END AS bounce_pct
FROM (
  SELECT session_id, COUNT(*) AS page_count
  FROM public.page_views
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY session_id
) s;
