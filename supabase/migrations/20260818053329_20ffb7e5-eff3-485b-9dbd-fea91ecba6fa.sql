CREATE TYPE public.app_role AS ENUM ('student', 'organization');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- assign role at signup from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen text;
BEGIN
  chosen := COALESCE(NEW.raw_user_meta_data->>'account_role', 'student');
  IF chosen NOT IN ('student', 'organization') THEN
    chosen := 'student';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, account_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    chosen
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- backfill roles for existing members
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id,
       CASE WHEN p.account_role = 'organization' THEN 'organization' ELSE 'student' END::public.app_role
FROM public.profiles p
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- submissions status
ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.validate_bid_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid submission status: %', NEW.status;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_bid_status_trigger ON public.bids;
CREATE TRIGGER validate_bid_status_trigger
BEFORE INSERT OR UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.validate_bid_status();

-- projects: organizations only
DROP POLICY IF EXISTS "Users can post projects" ON public.projects;
CREATE POLICY "Organizations can post projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'organization'));

DROP POLICY IF EXISTS "Owners can update their projects" ON public.projects;
CREATE POLICY "Owners can update their projects"
ON public.projects FOR UPDATE TO authenticated
USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'organization'))
WITH CHECK (auth.uid() = owner_id);

-- bids: students only, visibility restricted
DROP POLICY IF EXISTS "Users can place their own bids" ON public.bids;
CREATE POLICY "Students can submit their own work"
ON public.bids FOR INSERT TO authenticated
WITH CHECK (auth.uid() = bidder_id AND public.has_role(auth.uid(), 'student') AND status = 'pending');

DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;
CREATE POLICY "Students see own submissions, orgs see submissions on their tasks"
ON public.bids FOR SELECT TO authenticated
USING (
  auth.uid() = bidder_id
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = bids.project_id AND p.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own bids" ON public.bids;
CREATE POLICY "Students can edit their pending submissions"
ON public.bids FOR UPDATE TO authenticated
USING (auth.uid() = bidder_id AND status = 'pending')
WITH CHECK (auth.uid() = bidder_id AND status = 'pending');

CREATE POLICY "Organizations can review submissions on their tasks"
ON public.bids FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = bids.project_id AND p.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = bids.project_id AND p.owner_id = auth.uid()));