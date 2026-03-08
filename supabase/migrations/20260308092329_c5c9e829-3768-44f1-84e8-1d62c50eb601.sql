ALTER TABLE public.admin_users ADD COLUMN role text NOT NULL DEFAULT 'admin';

UPDATE public.admin_users SET role = 'readonly' WHERE user_id = '6d92305b-95f6-48c0-9e45-8640e2bd88e3';

CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_users WHERE user_id = _user_id LIMIT 1;
$$;