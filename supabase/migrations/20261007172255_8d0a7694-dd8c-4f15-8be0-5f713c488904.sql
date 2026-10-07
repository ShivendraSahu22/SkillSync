ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_approved_student(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND approval_status = 'approved')
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.approval_status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid approval status';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status
     AND auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change approval status';
  END IF;
  IF TG_OP = 'INSERT' AND auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid())
     AND NEW.account_role = 'student' THEN
    NEW.approval_status := 'pending';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_profile_approval BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_approval();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE chosen text;
BEGIN
  chosen := COALESCE(NEW.raw_user_meta_data->>'account_role', 'student');
  IF chosen NOT IN ('student', 'organization') THEN chosen := 'student'; END IF;
  INSERT INTO public.profiles (user_id, display_name, account_role, approval_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), chosen,
          CASE WHEN chosen = 'student' THEN 'pending' ELSE 'approved' END)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP POLICY "Students can submit their own work" ON public.bids;
CREATE POLICY "Approved students can submit their own work" ON public.bids FOR INSERT TO authenticated
WITH CHECK (auth.uid() = bidder_id AND has_role(auth.uid(), 'student'::app_role)
  AND public.is_approved_student(auth.uid()) AND status = 'pending');

CREATE POLICY "Admins can view all submissions" ON public.bids FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any task" ON public.projects FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_admin_project_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_admin(auth.uid()) AND OLD.owner_id IS DISTINCT FROM auth.uid() THEN
    IF NEW.reward < 0 THEN RAISE EXCEPTION 'Reward cannot be negative'; END IF;
    IF (to_jsonb(NEW) - 'reward' - 'deadline' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'reward' - 'deadline' - 'updated_at') THEN
      RAISE EXCEPTION 'Admins can only change reward and deadline';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_admin_project_update BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.guard_admin_project_update();

SELECT 1;