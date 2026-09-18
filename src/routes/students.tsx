import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react";

import { ProjectCard } from "@/components/project-card";
import { SubmissionReviewSummary } from "@/components/submission-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchBidCounts,
  fetchMyBids,
  fetchMyProfile,
  fetchProjects,
  timeAgo,
  type Project,
} from "@/lib/marketplace";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student home — tasks matched to your skills | SkillSync" },
      {
        name: "description",
        content:
          "Your SkillSync student home: tasks matched to your skills, the deliverables you have handed in and the reviews you received.",
      },
      { property: "og:title", content: "Student home on SkillSync" },
      {
        property: "og:description",
        content: "See the most relevant student tasks, your submissions and your reviews in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentsHome,
});

function relevance(project: Project, skills: string[]) {
  if (skills.length === 0) return 0;
  const haystack = [...project.skills, project.category, project.title]
    .join(" ")
    .toLowerCase();
  return skills.filter((skill) => skill.length > 1 && haystack.includes(skill.toLowerCase())).length;
}

function StudentsHome() {
  const { user, displayName } = useAuth();
  const userId = user?.id ?? null;

  const projectsQuery = useQuery({
    queryKey: ["projects", "students-home"],
    queryFn: () => fetchProjects({ limit: 30 }),
  });
  const bidCountsQuery = useQuery({ queryKey: ["bid-counts"], queryFn: fetchBidCounts });
  const profileQuery = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: () => fetchMyProfile(userId as string),
    enabled: Boolean(userId),
  });
  const bidsQuery = useQuery({
    queryKey: ["my-bids", userId],
    queryFn: () => fetchMyBids(userId as string),
    enabled: Boolean(userId),
  });

  const skills = profileQuery.data?.skills ?? [];
  const submittedIds = new Set((bidsQuery.data ?? []).map((bid) => bid.project_id));
  const open = (projectsQuery.data ?? []).filter(
    (project) => project.status === "open" && !submittedIds.has(project.id),
  );
  const ranked = [...open].sort((a, b) => relevance(b, skills) - relevance(a, skills)).slice(0, 6);

  const bids = bidsQuery.data ?? [];
  const pending = bids.filter((bid) => !bid.decision);
  const reviewed = bids.filter((bid) => bid.decision);
  const passed = reviewed.filter((bid) => bid.decision === "pass").length;

  return (
    <div>
      <section className="grid-canvas border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3.5" /> Built for students
          </Badge>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {user ? `Welcome back, ${displayName}.` : "Pick a task, hand in one deliverable, get a real review."}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Short, scoped tasks with a fixed reward. No hourly work, no long commitments — just the
            finished piece of work and honest feedback on it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={user ? "/portal" : "/student-signup"}>
                {user ? "Open student portal" : "Join as a student"}{" "}
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {user ? (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="plate p-5">
              <p className="text-sm text-muted-foreground">Submissions</p>
              <p className="mt-1 font-display text-2xl font-semibold">{bids.length}</p>
            </article>
            <article className="plate p-5">
              <p className="text-sm text-muted-foreground">Awaiting review</p>
              <p className="mt-1 font-display text-2xl font-semibold">{pending.length}</p>
            </article>
            <article className="plate p-5">
              <p className="text-sm text-muted-foreground">Passed reviews</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {passed}/{reviewed.length}
              </p>
            </article>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Most relevant tasks for you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {skills.length > 0
                ? `Matched against your skills: ${skills.slice(0, 6).join(", ")}`
                : "Newest open tasks — add skills to your profile for a closer match."}
            </p>
          </div>
          <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
            Browse all tasks →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-56 rounded-xl" />
              ))
            : null}
          {ranked.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              bidCount={bidCountsQuery.data?.[project.id] ?? 0}
            />
          ))}
          {!projectsQuery.isLoading && ranked.length === 0 ? (
            <p className="plate p-8 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">
              No open tasks right now — check back soon.
            </p>
          ) : null}
        </div>
      </section>

      {user ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-2xl font-semibold sm:text-3xl">Your submissions</h2>

          {bidsQuery.isLoading ? (
            <Skeleton className="mt-6 h-32 w-full rounded-xl" />
          ) : bids.length === 0 ? (
            <p className="plate mt-6 p-8 text-center text-muted-foreground">
              You have not handed in a deliverable yet. Pick a task above to start.
            </p>
          ) : (
            <div className="mt-6 grid gap-4">
              {bids.slice(0, 6).map((bid) => (
                <article key={bid.id} className="plate p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: bid.project_id }}
                        className="font-semibold hover:text-primary"
                      >
                        {bid.projects?.title ?? "Task"}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        handed in {timeAgo(bid.created_at)}
                      </p>
                    </div>
                    <Badge variant={bid.decision ? "default" : "outline"} className="gap-1">
                      {bid.decision ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <Clock className="size-3.5" />
                      )}
                      {bid.decision ? `Reviewed · ${bid.decision}` : "Awaiting review"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <SubmissionReviewSummary bid={bid} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
