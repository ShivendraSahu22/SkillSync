DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
CREATE POLICY "Visitors can view open tasks" ON public.projects FOR SELECT TO anon USING (status = 'open');
CREATE POLICY "Members can view relevant tasks" ON public.projects FOR SELECT TO authenticated USING (
  status = 'open' OR owner_id = auth.uid() OR public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.bids b WHERE b.project_id = projects.id AND b.bidder_id = auth.uid())
);

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Visitors can view approved profiles" ON public.profiles FOR SELECT TO anon USING (approval_status = 'approved');
CREATE POLICY "Members can view approved, own or all as admin" ON public.profiles FOR SELECT TO authenticated USING (
  approval_status = 'approved' OR user_id = auth.uid() OR public.is_admin(auth.uid())
);