import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Search, ShieldCheck, Wallet } from "lucide-react";

import { ProjectCard } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, fetchBidCounts, fetchProjects } from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSync — Hire freelancers, win great projects" },
      {
        name: "description",
        content:
          "SkillSync is a freelance marketplace: post a project, compare proposals, and hire vetted developers, designers and marketers.",
      },
      { property: "og:title", content: "SkillSync — freelance marketplace" },
      {
        property: "og:description",
        content: "Post projects, submit proposals, hire vetted freelance talent.",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: Search,
    title: "Post a brief",
    body: "Describe one deliverable, set a fixed reward and publish in minutes.",
  },
  {
    icon: BadgeCheck,
    title: "Compare proposals",
    body: "Freelancers bid with pricing, delivery time and a tailored pitch.",
  },
  {
    icon: Wallet,
    title: "Hire and pay",
    body: "Pick your specialist, agree milestones and keep everything in one thread.",
  },
];

function Index() {
  const projectsQuery = useQuery({
    queryKey: ["projects", "home"],
    queryFn: () => fetchProjects({ limit: 6 }),
  });
  const bidCountsQuery = useQuery({ queryKey: ["bid-counts"], queryFn: fetchBidCounts });

  return (
    <div>
      <section className="grid-canvas border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3.5" /> Vetted talent · transparent pricing
          </Badge>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Hire the right freelancer. Win the right project.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            A marketplace built for real work: clear briefs, honest bids and specialists across
            engineering, design, data and growth.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/post-project">
                Post a project <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/projects">Find work</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {CATEGORIES.slice(0, 6).map((category) => (
              <Link
                key={category}
                to="/projects"
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.title} className="plate p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <step.icon className="size-5" />
              </span>
              <h2 className="mt-4 font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold sm:text-3xl">Latest open projects</h2>
          <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
            Browse all projects →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-56 rounded-xl" />
              ))
            : null}
          {projectsQuery.data?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              bidCount={bidCountsQuery.data?.[project.id] ?? 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
