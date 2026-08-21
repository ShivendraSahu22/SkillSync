# SkillSync

## A Skill-Based Freelancing & Project Marketplace

**Hackathon:** Prasunethon 2.0
**Institution:** Global Nature Care Sangathan Group of Institutions (GNCSGI), Jabalpur, Madhya Pradesh

**Team Members**

* Shivendra Sahu
* Sahil Sahu
* Shrajal Sahu

**GitHub:** https://github.com/ShivendraSahu22/SkillSync

---

## 1. Abstract

**SkillSync** is a web-based freelancing and project marketplace that connects **project owners with skilled individuals**.

Users can explore projects, view project details, discover freelancers, and post new projects through a simple marketplace interface.

The application is built using **React, TypeScript, Vite, TanStack Start/Router, Tailwind CSS, and Supabase**.

The goal of SkillSync is to simplify skill-based collaboration by connecting **people who need work with people who have the required skills**.

---

# 2. Problem Statement

Finding the right person for a specific project can be difficult and time-consuming.

### Problems for Project Owners

* Difficulty finding suitable talent.
* Manual and time-consuming talent discovery.
* Lack of a centralized project marketplace.
* Difficulty communicating project requirements.

### Problems for Freelancers

* Difficulty discovering relevant projects.
* Limited visibility of available opportunities.
* Difficulty presenting skills to potential clients.

### Proposed Idea

SkillSync provides a single platform where project owners can **post projects** and freelancers can **discover suitable opportunities**.

---

# 3. Objectives

The main objectives of SkillSync are:

1. Create a simple freelancing marketplace.
2. Allow users to browse projects.
3. Provide detailed project pages.
4. Enable project posting.
5. Provide freelancer discovery.
6. Implement authentication.
7. Provide a user dashboard.
8. Build a scalable and maintainable architecture.
9. Integrate Supabase for backend services.

---

# 4. Key Features

### 🔐 Authentication

User authentication and session management.

### 📊 Dashboard

Centralized workspace for authenticated users.

### 📁 Project Marketplace

Browse and explore available projects.

### 🔎 Project Details

View individual project information through dynamic project pages.

### ➕ Post Project

Project owners can create and publish projects.

### 👨‍💻 Freelancer Discovery

Browse and discover freelancers.

### 🎨 Reusable UI

Reusable components provide a consistent interface across the application.

---

# 5. How It Works

### Freelancer Flow

```text
Login
  ↓
Dashboard
  ↓
Browse Projects
  ↓
Select Project
  ↓
View Details
  ↓
Continue Project Workflow
```

### Project Owner Flow

```text
Login
  ↓
Dashboard
  ↓
Post Project
  ↓
Add Requirements
  ↓
Publish Project
```

---

# 6. Technology Stack

| Technology      | Purpose                  |
| --------------- | ------------------------ |
| React           | Frontend UI              |
| TypeScript      | Type-safe development    |
| Vite            | Development & build tool |
| TanStack Start  | Application framework    |
| TanStack Router | Routing                  |
| Tailwind CSS    | Styling                  |
| Radix UI        | UI components            |
| Supabase        | Backend & database       |
| React Hook Form | Form management          |
| Zod             | Validation               |

---

# 7. System Architecture

```text
              USER
                │
                ▼
        ┌───────────────┐
        │ React Frontend│
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │TanStack Router│
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Application   │
        │ Logic / Hooks │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   Supabase    │
        ├───────────────┤
        │ Auth + Database│
        └───────────────┘
```

---

# 8. Project Structure

```text
SkillSync/
├── public/
├── src/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── integrations/
│   │   └── supabase/
│   ├── lib/
│   ├── routes/
│   │   ├── auth.tsx
│   │   ├── dashboard.tsx
│   │   ├── freelancers.tsx
│   │   ├── post-project.tsx
│   │   ├── projects.index.tsx
│   │   └── projects.$projectId.tsx
│   └── router.tsx
├── supabase/
│   └── migrations/
├── package.json
└── vite.config.ts
```

---

# 9. Installation & Setup

### Clone Repository

```bash
git clone https://github.com/ShivendraSahu22/SkillSync.git
cd SkillSync
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Start Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

# 10. Testing

The application should be tested for:

* Authentication.
* Project listing.
* Project details.
* Project creation.
* Freelancer discovery.
* Form validation.
* Responsive UI.
* Supabase connectivity.

Before deployment:

```bash
npm run lint
npm run build
```

---

# 11. Challenges & Solutions

| Challenge                  | Solution                          |
| -------------------------- | --------------------------------- |
| Multiple application pages | TanStack file-based routing       |
| UI consistency             | Reusable components               |
| Backend integration        | Supabase                          |
| Form management            | React Hook Form + Zod             |
| Maintainability            | TypeScript + modular architecture |

---

# 12. Future Scope

Future versions can include:

* 🤖 AI-based skill/project matching.
* ⭐ Ratings and reviews.
* 💬 Real-time messaging.
* 💳 Payment and escrow system.
* 🔔 Notifications.
* 🔍 Advanced search and filtering.
* 📈 User and project analytics.

### Future AI Matching

```text
User Skills
     +
Project Requirements
     ↓
AI Matching
     ↓
Recommended Projects
```

---

# 13. Hackathon Demo Flow

For the live demonstration:

```text
Landing Page
      ↓
Login
      ↓
Dashboard
      ↓
Browse Projects
      ↓
Project Details
      ↓
Freelancer Section
      ↓
Post Project
      ↓
Publish Project
```

The demonstration should focus on showing the **complete user journey and the problem being solved**.

---

# 14. Screenshots

Add screenshots of:

1. Home Page
2. Login/Register
3. Dashboard
4. Project Marketplace
5. Project Details
6. Freelancer Discovery
7. Post Project

---

# 15. Conclusion

SkillSync provides a simple and modern platform for connecting **project requirements with skilled individuals**.

By combining React, TypeScript, TanStack, Tailwind CSS, and Supabase, the project provides a strong foundation for a scalable freelancing marketplace.

With future additions such as AI matching, messaging, ratings, payments, and notifications, SkillSync can evolve into a complete skill-based collaboration platform.

> **SkillSync — Connecting Skills with Opportunities.**

---

## Project Information

**Project:** SkillSync
**Hackathon:** Prasunethon 2.0
**Institution:** GNCSGI, Jabalpur
**Team:** Shivendra Sahu, Sahil Sahu, Shrajal Sahu
**Repository:** https://github.com/ShivendraSahu22/SkillSync
