import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ClipboardList, Send, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RUBRIC_CRITERIA } from "@/lib/marketplace";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How SkillSync works — tasks, deliverables and reviews" },
      {
        name: "description",
        content:
          "A step-by-step guide to SkillSync: how organizations post scoped tasks, how students hand in one deliverable and how reviews are scored.",
      },
      { property: "og:title", content: "How SkillSync works" },
      {
        property: "og:description",
        content:
          "Post a scoped task, hand in one deliverable, get a rubric-based review with a pass or fail decision.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const STUDENT_STEPS = [
  {
    icon: ClipboardList,
    title: "1. Read the brief",
    body: "Every task names one deliverable, the requirements, how it will be judged and the fixed reward. Nothing is measured in hours.",
  },
  {
    icon: Send,
    title: "2. Hand in your deliverable",
    body: "Do the work, then submit a public link to the finished file, repo or design plus a few notes on your choices.",
  },
  {
    icon: BadgeCheck,
    title: "3. Get reviewed",
    body: "The organization marks it pass or fail, scores three rubric criteria from 1 to 5 and writes feedback you can act on.",
  },
  {
    icon: Star,
    title: "4. Build a track record",
    body: "Passed tasks, scores and feedback collect on your profile, so your next application shows real, reviewed work.",
  },
];

const ORG_STEPS = [
  "Describe one clear deliverable and the skills it needs.",
  "Set the requirements, evaluation criteria and submission format.",
  "Pick a fixed reward based on difficulty and quality, plus a deadline.",
  "Review each hand-in against the rubric and pass or fail it with feedback.",
];

const FAQ = [
  {
    q: "Is this paid by the hour?",
    a: "No. Every task carries a fixed reward set by its difficulty and the quality expected. Time spent is never part of the deal or the review.",
  },
  {
    q: "How long is a task?",
    a: "Each one is a short, standalone piece of work with a clear finishing point — never an internship, retainer or ongoing role.",
  },
  {
    q: "What counts as a submission?",
    a: "A public link to the finished deliverable in the requested format, plus short notes explaining your approach.",
  },
  {
    q: "Can students post tasks?",
    a: "No. Posting is for organization accounts; student accounts browse, submit and track reviews.",
  },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          How SkillSync works
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          One task, one deliverable, one honest review. Here is the whole flow for students and for
          organizations.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">For students</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {STUDENT_STEPS.map((step) => (
            <article key={step.title} className="plate p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/students">
              Student home <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/projects">Browse tasks</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">How reviews are scored</h2>
        <p className="mt-2 text-muted-foreground">
          Each submission is scored 1–5 on three criteria, then passed or failed with written
          feedback.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {RUBRIC_CRITERIA.map((criterion) => (
            <li key={criterion.key} className="plate p-5">
              <p className="font-medium">{criterion.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{criterion.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">For organizations</h2>
        <ol className="mt-5 grid gap-3">
          {ORG_STEPS.map((step, index) => (
            <li key={step} className="plate flex gap-3 p-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <p className="text-sm text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
        <Button asChild className="mt-6">
          <Link to="/post-project">Post a task</Link>
        </Button>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Common questions</h2>
        <div className="mt-5 grid gap-3">
          {FAQ.map((item) => (
            <article key={item.q} className="plate p-5">
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
