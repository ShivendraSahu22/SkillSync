CREATE OR REPLACE FUNCTION public.has_submitted_to_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bids b
    WHERE b.project_id = _project_id
      AND b.bidder_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.has_submitted_to_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_submitted_to_project(uuid) TO authenticated;

DROP POLICY IF EXISTS "Members can view relevant tasks" ON public.projects;
CREATE POLICY "Members can view relevant tasks"
ON public.projects FOR SELECT TO authenticated
USING (
  status = 'open'
  OR owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR public.has_submitted_to_project(id)
);