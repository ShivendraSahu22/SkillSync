ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS deliverable text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requirements text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS evaluation_criteria text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS submission_format text NOT NULL DEFAULT 'Public link (GitHub / Drive / Figma)',
  ADD COLUMN IF NOT EXISTS reward numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deadline date;

UPDATE public.projects SET reward = GREATEST(COALESCE(budget_max, 0), COALESCE(budget_min, 0)) WHERE reward = 0;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_difficulty_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_difficulty_check CHECK (difficulty IN ('Beginner','Intermediate','Advanced'));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_reward_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_reward_check CHECK (reward >= 0);

ALTER TABLE public.projects
  DROP COLUMN IF EXISTS budget_type,
  DROP COLUMN IF EXISTS budget_min,
  DROP COLUMN IF EXISTS budget_max;

ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS submission_url text;
ALTER TABLE public.bids
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS delivery_days;

DELETE FROM public.projects WHERE owner_id IS NULL;

INSERT INTO public.projects (owner_id, owner_name, title, description, category, skills, status, difficulty, deliverable, requirements, evaluation_criteria, submission_format, reward, deadline)
VALUES
(NULL, 'Northwind Labs', 'Build a responsive pricing section in React + Tailwind',
 'Recreate a three-tier pricing section as a single reusable React component. Scope is limited to one section — no routing, backend or auth.',
 'Web Development', ARRAY['React','Tailwind CSS','Responsive Design'], 'open', 'Beginner',
 'One React component file (PricingSection.tsx) rendering three pricing tiers, plus screenshots of the desktop and mobile view.',
 E'- Use React function components and Tailwind utility classes only\n- Highlight the middle tier as "Most popular"\n- Must be readable at 375px and 1280px widths\n- No external UI kits',
 E'- Visual match to the reference (30%)\n- Responsive behaviour at both breakpoints (30%)\n- Component reusability and prop design (25%)\n- Code cleanliness (15%)',
 'GitHub repo link or CodeSandbox link + 2 screenshots', 45, (CURRENT_DATE + 7)),
(NULL, 'Aster Analytics', 'Clean and summarise a 500-row messy sales CSV',
 'Take one messy sales CSV and produce a cleaned dataset plus three written findings. Single dataset, single notebook.',
 'Data', ARRAY['Python','pandas','Data Cleaning'], 'open', 'Beginner',
 'A cleaned CSV file and one Jupyter notebook containing the cleaning steps and three written findings.',
 E'- Handle missing values, duplicate rows and inconsistent date formats\n- Keep every cleaning step reproducible in the notebook\n- State all assumptions in a markdown cell',
 E'- Correctness of cleaning logic (40%)\n- Notebook runs end to end (30%)\n- Clarity of the three findings (20%)\n- Readability (10%)',
 '.ipynb notebook + cleaned .csv in a GitHub repo or Drive folder', 40, (CURRENT_DATE + 5)),
(NULL, 'Foldwork Studio', 'Design a 3-screen mobile onboarding flow in Figma',
 'Design exactly three onboarding screens for a habit tracking app. Scope stops at static screens — no full app prototype.',
 'Design', ARRAY['Figma','UI Design','Mobile Design'], 'open', 'Intermediate',
 'A Figma file with three onboarding screens at 390x844 plus a shared style block (colors + type scale).',
 E'- Screens: value proposition, permissions, first habit setup\n- One consistent type scale on an 8pt spacing grid\n- Light mode only\n- Reusable Figma components',
 E'- Visual hierarchy and copy clarity (35%)\n- Consistency of spacing and type system (30%)\n- Correct use of components (25%)\n- File organisation (10%)',
 'Figma share link (view access) + exported PNGs', 60, (CURRENT_DATE + 6)),
(NULL, 'Loop Content Co', 'Write 5 product description cards for an eco water bottle',
 'Write five short product description variants for one product. Standalone copy task with a fixed word budget.',
 'Writing', ARRAY['Copywriting','Product Marketing'], 'open', 'Beginner',
 'One document with five description variants, each 40–60 words, plus a one-line rationale per variant.',
 E'- Five distinct angles (durability, design, sustainability, gifting, value)\n- 40–60 words each, no repeated opening lines\n- Plain, non-hyped language',
 E'- Persuasiveness and clarity (40%)\n- Angle differentiation (30%)\n- Adherence to word limits (20%)\n- Grammar and polish (10%)',
 'Google Doc link or PDF', 25, (CURRENT_DATE + 4)),
(NULL, 'Kernel Systems', 'Implement a rate limiter function with unit tests',
 'Implement a single token-bucket rate limiter function in TypeScript with tests. One function, one test file.',
 'Web Development', ARRAY['TypeScript','Testing','Algorithms'], 'open', 'Advanced',
 'One TypeScript module exporting createRateLimiter() and a passing test file covering at least 6 cases.',
 E'- Token bucket algorithm with configurable capacity and refill rate\n- No third-party runtime dependencies\n- Tests written with Vitest and all passing\n- Include edge cases: burst, refill, zero capacity',
 E'- Correctness of the algorithm (40%)\n- Test coverage of edge cases (30%)\n- API design and typings (20%)\n- Code clarity (10%)',
 'GitHub repo link with README run instructions', 90, (CURRENT_DATE + 8));
