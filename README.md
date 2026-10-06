# SkillSync

SkillSync is a student micro-task marketplace where organizations post short, clearly scoped tasks and students submit one measurable deliverable for a fixed reward. Every submission is reviewed against a transparent rubric so students can build practical experience and a credible record of their work.

## Live project

- **Application:** [skiillsync.lovable.app](https://skiillsync.lovable.app)
- **Presentation:** [SkillSync slides](https://drive.google.com/drive/folders/1waws28yi8hPBnunUd8Oo0V595dOrCleu)
- **Demo video:** [Watch on YouTube](https://youtu.be/B45qCGAMYlM)

## What SkillSync solves

Students often understand concepts but lack focused opportunities to apply them. Organizations, meanwhile, have valuable standalone tasks that do not justify a full-time role or long-term project.

SkillSync connects both sides through work that is:

- short and independently completable;
- defined by a concrete deliverable;
- paid with a fixed reward rather than hourly rates;
- evaluated on quality, not time spent;
- reviewed with clear pass/fail feedback and rubric scores.

## Main features

### Students

- Create a dedicated student account and profile.
- Browse all open tasks and filter by category or search term.
- Discover tasks matched to profile skills or a natural-language description.
- Submit a public deliverable link with supporting notes.
- Track pending, passed, and failed submissions.
- Review rubric scores and written organization feedback.
- Use the AI student coach for task planning, submission feedback, and skill guidance.
- Keep multiple AI conversations locally in the current browser.

### Organizations

- Create and maintain an organization profile with contact details.
- Post fixed-reward tasks with requirements, skills, deadline, and submission format.
- Define deliverables and evaluation criteria before publishing.
- View student submissions for owned tasks.
- Pass or fail each submission with three 1–5 rubric scores and written feedback.

### Platform safeguards

- Separate student and organization permissions.
- Server-validated access to protected AI features.
- Row-level data rules for profiles, tasks, submissions, and reviews.
- Database enforcement that prevents students or organizations from changing protected submission fields.
- Server-side AI Gateway credentials and prompts.

## User journeys

### Student flow

```text
Create student account
        ↓
Complete skill profile
        ↓
Discover or match with an open task
        ↓
Submit one deliverable
        ↓
Receive rubric-based review
        ↓
Use feedback to improve and build a track record
```

### Organization flow

```text
Create organization account
        ↓
Complete organization profile
        ↓
Post a scoped, fixed-reward task
        ↓
Receive student submissions
        ↓
Review against the published rubric
        ↓
Pass or fail with actionable feedback
```

## Application pages

| Page | Purpose |
| --- | --- |
| `/` | Main marketplace homepage |
| `/students` | Student home with relevant tasks, submissions, reviews, and AI matching |
| `/how-it-works` | Student and organization workflow guide |
| `/portal` | Student task browsing, submission, and review tracking |
| `/profile` | Student profile and submission history |
| `/chat` | Student-only AI coach and conversation list |
| `/projects` | Public open-task directory |
| `/post-project` | Organization task creation |
| `/dashboard` | Role-specific student or organization dashboard |
| `/org-profile` | Organization identity and contact settings |

## Technology

- **Application:** React 19 and TanStack Start
- **Routing:** TanStack Router
- **Data fetching:** TanStack Query
- **Styling:** Tailwind CSS v4 and reusable accessible UI components
- **Backend:** Lovable Cloud authentication, database, and row-level access rules
- **AI:** Lovable AI Gateway with streamed Responses API output
- **Validation:** Zod and server-side authorization checks
- **Build tooling:** Vite and TypeScript

## Project structure

```text
src/
├── assets/                 Brand and visual assets
├── components/
│   ├── ai-elements/       Streaming chat interface primitives
│   └── ui/                Shared application controls
├── hooks/                  Authentication and application hooks
├── integrations/           Managed Lovable Cloud client code
├── lib/                    Marketplace, AI, validation, and storage logic
└── routes/                 Pages and server endpoints
supabase/
└── migrations/             Versioned database schema and access rules
```

## Local development

### Requirements

- Bun 1.3 or newer
- A connected Lovable Cloud project
- A Lovable AI Gateway key for AI features

### Setup

```bash
git clone https://github.com/ShivendraSahu22/SkillSync.git
cd SkillSync
bun install
bun run dev
```

The application uses managed environment values for its cloud backend and AI Gateway. Keep private keys server-side and never add them to browser-prefixed variables or commit them to source control.

### Commands

```bash
bun run dev       # Start local development
bun run build     # Create a production build
bun run preview   # Preview the production build
bun run lint      # Run lint checks
bun run format    # Format the project
```

## Task rules

SkillSync tasks are intentionally not job listings. Every task should include:

- a task title and concise description;
- required skills and a difficulty level;
- one concrete deliverable;
- requirements and evaluation criteria;
- a submission format;
- a fixed reward;
- skill tags and a deadline.

Tasks must not be hourly, ongoing, multi-day commitments, internships, or full-time jobs.

## Status

SkillSync is a working full-stack application with role-based access, task publishing, submissions, rubric reviews, student and organization profiles, dashboards, AI task matching, and a student AI coach.

## Team

Built by **Shivendra Sahu**, **Shrajal Sahu**, and **Sahil Sahu** with [Lovable](https://lovable.dev).

- [Shivendra Sahu](https://github.com/ShivendraSahu22)
- [Sahil Sahu](https://github.com/Sahil-Sahu-32)
- [Shrajal Sahu](https://github.com/Shrajal-sahu-18)
- [SkillSync repository](https://github.com/ShivendraSahu22/SkillSync)

> Learn skills. Solve real problems. Build your future.