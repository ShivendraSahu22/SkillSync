CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  display_name text NOT NULL DEFAULT 'New member',
  headline text,
  bio text,
  avatar_url text,
  location text,
  hourly_rate numeric,
  skills text[] NOT NULL DEFAULT '{}',
  rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  account_role text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  owner_name text NOT NULL DEFAULT 'Client',
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  budget_type text NOT NULL DEFAULT 'fixed',
  budget_min numeric NOT NULL DEFAULT 0,
  budget_max numeric NOT NULL DEFAULT 0,
  skills text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  bidder_name text NOT NULL DEFAULT 'Freelancer',
  amount numeric NOT NULL,
  delivery_days integer NOT NULL DEFAULT 7,
  proposal text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, bidder_id)
);

CREATE INDEX projects_created_at_idx ON public.projects (created_at DESC);
CREATE INDEX bids_project_id_idx ON public.bids (project_id);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

GRANT SELECT ON public.bids TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can post projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Bids are viewable by everyone" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Users can place their own bids" ON public.bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "Users can update their own bids" ON public.bids FOR UPDATE TO authenticated USING (auth.uid() = bidder_id) WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "Users can withdraw their own bids" ON public.bids FOR DELETE TO authenticated USING (auth.uid() = bidder_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'account_role', 'both')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (display_name, headline, bio, location, hourly_rate, skills, rating, reviews_count, account_role) VALUES
('Amara Osei', 'Senior React & TypeScript engineer', 'I ship production-grade dashboards and design systems. 9 years building web apps for fintech and healthtech teams.', 'Accra, Ghana', 65, ARRAY['React','TypeScript','Tailwind CSS','Node.js'], 4.9, 187, 'freelancer'),
('Diego Marchetti', 'Brand identity & packaging designer', 'Logos, brand books and packaging that survive contact with real shelves. Adobe-certified, 200+ launched brands.', 'Milan, Italy', 55, ARRAY['Branding','Illustrator','Packaging','Figma'], 4.8, 142, 'freelancer'),
('Priya Raghavan', 'Data engineer — pipelines & analytics', 'Airflow, dbt and Postgres. I turn messy CSV chaos into dashboards your board actually trusts.', 'Bengaluru, India', 48, ARRAY['Python','SQL','dbt','Airflow'], 5.0, 96, 'freelancer'),
('Lukas Berg', 'Motion designer & video editor', 'Short-form ads and explainer videos. After Effects wizard with a soft spot for kinetic type.', 'Berlin, Germany', 42, ARRAY['After Effects','Premiere Pro','Motion Design'], 4.7, 78, 'freelancer'),
('Sofia Alvarez', 'SEO & content strategist', 'I build content engines that rank. 3x traffic in 6 months is a normal engagement for me.', 'Bogotá, Colombia', 38, ARRAY['SEO','Content Strategy','Copywriting'], 4.9, 121, 'freelancer'),
('Kenji Tanaka', 'iOS engineer (Swift / SwiftUI)', 'Native apps with obsessive attention to motion and accessibility. Ex-agency lead.', 'Osaka, Japan', 72, ARRAY['Swift','SwiftUI','iOS','Firebase'], 4.8, 64, 'freelancer');

INSERT INTO public.projects (owner_name, title, description, category, budget_type, budget_min, budget_max, skills) VALUES
('Northwind Labs', 'Build a customer analytics dashboard in React', 'We need a responsive analytics dashboard with charts, filters and CSV export. Designs are ready in Figma. Backend API already exists (REST + JWT).', 'Web Development', 'fixed', 1800, 3200, ARRAY['React','TypeScript','Charts']),
('Bloom & Co', 'Brand identity for an organic skincare line', 'Full identity: logo, palette, typography, packaging for 6 SKUs and a one-page brand guide. Natural, minimal, not clichéd.', 'Design', 'fixed', 1200, 2500, ARRAY['Branding','Illustrator','Packaging']),
('Fleetly', 'Set up dbt models for our warehouse', 'Postgres warehouse, ~40 raw tables. Need staging + mart models, tests and documentation. Ongoing work likely.', 'Data', 'hourly', 40, 70, ARRAY['dbt','SQL','Python']),
('Cadence Fitness', '30 short-form video ads for a fitness app', 'Provide raw footage and script. Need 30 vertical cuts with captions and kinetic type, delivered weekly in batches of 10.', 'Video', 'fixed', 900, 1600, ARRAY['Premiere Pro','After Effects','Motion Design']),
('Harbor Legal', 'SEO audit and 6-month content plan', 'Small law firm site, 40 pages. Want a technical audit, keyword map and a monthly content calendar we can execute in-house.', 'Marketing', 'fixed', 700, 1400, ARRAY['SEO','Content Strategy']),
('Ridgeline Outdoors', 'iOS companion app for our GPS trackers', 'SwiftUI app that pairs over BLE, shows live tracks on a map and syncs history. MVP scope, 8-10 weeks.', 'Mobile', 'fixed', 6000, 11000, ARRAY['Swift','SwiftUI','BLE']),
('Studio Verse', 'Webflow to custom Next.js migration', 'Marketing site with blog and 3 landing pages. Must keep URLs and improve Lighthouse scores.', 'Web Development', 'hourly', 35, 60, ARRAY['Next.js','Tailwind CSS','SEO']),
('Kettle Coffee', 'Shopify storefront redesign', 'Refresh a Shopify theme: new homepage, PDP and cart drawer. Conversion-focused, mobile first.', 'Design', 'fixed', 1500, 2800, ARRAY['Shopify','Figma','CSS']);