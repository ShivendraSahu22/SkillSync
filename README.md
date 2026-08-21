# SkillSync 🚀

## 🌐 Live Demo

🚀 **Try SkillSync:** [Live Demo](https://skiillsync.lovable.app)

Explore the SkillSync platform and experience the student task marketplace.


### Skill-Based Task Marketplace for Students

**SkillSync** connects students with real-world, skill-based tasks from organizations. Students can discover relevant tasks, submit their work, receive evaluations, earn rewards, and build practical experience.

---

## 🎯 Problem

Students often have theoretical knowledge but lack opportunities to gain **real-world experience** and demonstrate their practical skills.

Organizations also have smaller tasks that can be completed without hiring full-time employees.

SkillSync aims to bridge this gap by connecting **student skills with real-world tasks**.

---

## 🔄 User Flow

### Student

```text
Register
   ↓
Select Skills
   ↓
Discover Tasks
   ↓
Select Task
   ↓
Submit Deliverable
   ↓
Organization Review
   ↓
Accepted / Rejected
   ↓
Build Experience
```

### Organization

```text
Register
   ↓
Post Task
   ↓
Define Requirements
   ↓
Receive Submissions
   ↓
Review
   ↓
Accept / Reject
```

---

## 📁 Project Structure

```text
SkillSync/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   │   └── useAuth.tsx
│   ├── integrations/
│   │   └── supabase/
│   ├── lib/
│   │   └── marketplace.ts
│   └── routes/
│       ├── auth.tsx
│       ├── dashboard.tsx
│       ├── freelancers.tsx
│       ├── post-project.tsx
│       ├── projects.index.tsx
│       └── projects.$projectId.tsx
├── supabase/
│   └── migrations/
├── package.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Installation

### Requirements

* Node.js
* npm
* Git
* Supabase project

### Setup

```bash
git clone https://github.com/ShivendraSahu22/SkillSync.git
cd SkillSync
npm install
```

Create environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

Start the development server:

```bash
npm run dev
```

### Useful Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```
```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


---

## 📌 Project Status

**MVP / Hackathon Prototype**

SkillSync currently provides authentication, student/organization roles, task discovery, task posting, submissions, dashboards, and Supabase-backed marketplace functionality.

---

## 👨‍💻 Developer

**Built by:** Shivendra Sahu, Shrajal Sahu, Sahil Sahu  
**Built with:** [Lovable](https://lovable.dev)

### GitHub

[Shivendra Sahu](https://github.com/ShivendraSahu22)  
[Sahil Sahu](https://github.com/Sahil-Sahu-32)  
[Shrajal Sahu](https://github.com/Shrajal-sahu-18)

### Repository

[SkillSync](https://github.com/ShivendraSahu22/SkillSync)
---

## ⭐ SkillSync

> **Learn Skills. Solve Real Problems. Build Your Future.**

**SkillSync — Connecting Student Skills with Real-World Opportunities.**
