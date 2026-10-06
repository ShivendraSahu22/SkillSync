import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CheckCircle2, Clock, ExternalLink, Plus } from "lucide-react";

import { SubmissionReviewForm, SubmissionReviewSummary } from "@/components/submission-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyProjects,
  fetchSubmissionsForMyProjects,
  formatDeadline,
  formatReward,
  timeAgo,
} from "@/lib/marketplace";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [
      { title: "Organization home — your tasks and reviews | SkillSync" },
      {
        name: "description",
        content:
          "Manage your posted SkillSync tasks, review student submissions and track your feedback in one place.",
      },
      { property: "og:title", content: "Organization home on SkillSync" },
      {
        property: "og:description",
        content: "Your posted tasks, incoming student deliverables and completed reviews together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizationHome,
});

function OrganizationHome() {
  const { user, displayName, isOrganization, roleLoading, loading } = useAuth();
  const userId = user?.id ?? null;
  const enabled = Boolean(userId) && isOrganization;

  const projectsQuery = useQuery({
    queryKey: ["my-projects", userId],
    queryFn: () => fetchMyProjects(userId as string),
    enabled,
  });
  const subsQuery = useQuery({
    queryKey: ["org-submissions", userId],
    queryFn: () => fetchSubmissionsForMyProjects(userId as string),
    enabled,
  });

  if (loading || roleLoading) {
    return <Skeleton className="mx-auto my-16 h-64 max-w-6xl rounded-xl" />;
  }

  if (!user || !isOrganization) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Building2 className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-3xl font-semibold">Organization home</h1>
        <p className="mt-3 text-muted-foreground">
          {user
            ? "This page is for organization accounts. Students can use their student home."
            : "Sign in with your organization account to manage tasks and reviews."}
        </p>
        <Button asChild className="mt-6">
          <Link to={user ? "/students" : "/auth"}>{user ? "Go to student home" : "Sign in"}</Link>
        </Button>
      </div>
    );
  }

  const projects = projectsQuery.data ?? [];
  const subs = subsQuery.data ?? [];
  const pending = subs.filter((s) => !s.decision);
  const reviewed = subs.filter((s) => s.decision);
  const passed = reviewed.filter((s) => s.decision === "pass").length;
  const countFor = (id: string) => subs.filter((s) => s.project_id === id).length;
  const pendingFor = (id: string) => pending.filter((s) => s.project_id === id).length;

  return (
    <div>
      <section className="grid-canvas border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Badge variant="secondary" className="gap-1">
            <Building2 className="size-3.5" /> Organization home
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome back, {displayName}.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Your tasks, incoming deliverables and reviews — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/post-project">
                <Plus className="mr-1 size-4" /> Post a task
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/org-profile">Edit organization details</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Posted tasks", projects.length],
            ["Submissions", subs.length],
            ["Awaiting review", pending.length],
            ["Passed", `${passed}/${reviewed.length}`],
          ].map(([label, value]) => (
            <article key={label} className="plate p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="text-2xl font-semibold sm:text-3xl">Your posted tasks</h2>
        {projectsQuery.isLoading ? (
          <Skeleton className="mt-6 h-32 rounded-xl" />
        ) : projects.length === 0 ? (
          <p className="plate mt-6 p-8 text-center text-muted-foreground">
            You have not posted a task yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <article key={p.id} className="plate flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="font-semibold hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <Badge variant="outline" className="capitalize">
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.difficulty} · {formatReward(p.reward)} · {formatDeadline(p.deadline)}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                  <span>
                    {countFor(p.id)} submissions · {pendingFor(p.id)} to review
                  </span>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="inline-flex items-center font-medium text-primary hover:underline"
                  >
                    Manage <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="text-2xl font-semibold sm:text-3xl">Awaiting your review</h2>
        {subsQuery.isLoading ? (
          <Skeleton className="mt-6 h-32 rounded-xl" />
        ) : pending.length === 0 ? (
          <p className="plate mt-6 p-8 text-center text-muted-foreground">
            No submissions waiting. You are all caught up.
          </p>
        ) : (
          <div className="mt-6 grid gap-4">
            {pending.map((s) => (
              <article key={s.id} className="plate p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.bidder_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.projects?.title ?? "Task"} · handed in {timeAgo(s.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="size-3.5" /> Awaiting review
                  </Badge>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm">{s.proposal}</p>
                {s.submission_url ? (
                  <a
                    href={s.submission_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Open deliverable <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
                <div className="mt-4">
                  <SubmissionReviewForm bidId={s.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold sm:text-3xl">Reviews you have given</h2>
        {reviewed.length === 0 ? (
          <p className="plate mt-6 p-8 text-center text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {reviewed.map((s) => (
              <article key={s.id} className="plate p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.bidder_name}</p>
                    <p className="text-xs text-muted-foreground">{s.projects?.title ?? "Task"}</p>
                  </div>
                  <Badge className="gap-1 capitalize">
                    <CheckCircle2 className="size-3.5" /> {s.decision}
                  </Badge>
                </div>
                <div className="mt-3">
                  <SubmissionReviewSummary bid={s} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
