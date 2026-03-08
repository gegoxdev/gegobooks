-- Create viewer links table
CREATE TABLE public.viewer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
  label text NOT NULL DEFAULT 'Viewer Link',
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  last_accessed_at timestamptz,
  access_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.viewer_links ENABLE ROW LEVEL SECURITY;

-- Only master admins can manage viewer links (via functions)
-- No direct RLS select needed since we use security definer functions

-- Create viewer link (master only)
CREATE OR REPLACE FUNCTION public.create_viewer_link(link_label text, link_expires_at timestamptz DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  link_token text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can create viewer links';
  END IF;

  INSERT INTO public.viewer_links (label, created_by, expires_at)
  VALUES (link_label, auth.uid(), link_expires_at)
  RETURNING token INTO link_token;

  RETURN link_token;
END;
$$;

-- List viewer links (master only)
CREATE OR REPLACE FUNCTION public.list_viewer_links()
RETURNS TABLE(id uuid, token text, label text, is_active boolean, created_at timestamptz, expires_at timestamptz, last_accessed_at timestamptz, access_count integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can view viewer links';
  END IF;

  RETURN QUERY
  SELECT vl.id, vl.token, vl.label, vl.is_active, vl.created_at, vl.expires_at, vl.last_accessed_at, vl.access_count
  FROM public.viewer_links vl
  WHERE vl.created_by = auth.uid()
  ORDER BY vl.created_at DESC;
END;
$$;

-- Revoke viewer link (master only)
CREATE OR REPLACE FUNCTION public.revoke_viewer_link(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can revoke viewer links';
  END IF;

  UPDATE public.viewer_links SET is_active = false WHERE id = link_id AND created_by = auth.uid();
END;
$$;

-- Reactivate viewer link (master only)
CREATE OR REPLACE FUNCTION public.reactivate_viewer_link(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can reactivate viewer links';
  END IF;

  UPDATE public.viewer_links SET is_active = true WHERE id = link_id AND created_by = auth.uid();
END;
$$;

-- Delete viewer link permanently (master only)
CREATE OR REPLACE FUNCTION public.delete_viewer_link(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.admin_users WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'master' THEN
    RAISE EXCEPTION 'Only master admins can delete viewer links';
  END IF;

  DELETE FROM public.viewer_links WHERE id = link_id AND created_by = auth.uid();
END;
$$;