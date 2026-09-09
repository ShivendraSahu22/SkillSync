import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DeliverableSubmitForm } from "@/components/deliverable-submit-form";
import { SubmissionReviewSummary } from "@/components/submission-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  CATEGORIES,
  fetchMyBids,
  fetchProjects,
  formatDeadline,
  formatReward,
  timeAgo,
} from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Student portal — SkillSync" },
      {
        name: "description",
        content:
          "One place for students: see every posted task, submit your deliverable and track pass/fail reviews with rubric feedback.",
      },
      { property: "og:title", content: "SkillSync student portal" },
      {
        property: "og:description",
        content: "Browse posted tasks, submit deliverables and follow every review in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentPortal,
});

function statusVariant(status: string) {
  if (status === "accepted") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

function StudentPortal() {
  const { user, displayName, isOrganization, roleLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openTask, setOpenTask] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects", category, search],
    queryFn: () => fetchProjects({ category, search }),
  });

  const bidsQuery = useQuery({
    queryKey: ["my-bids", user?.id],
    queryFn: () => fetchMyBids(user!.id),
    enabled: Boolean(user),
  });

  const submittedIds = useMemo(
    () => new Set((bidsQuery.data ?? []).map((bid) => bid.project_id)),
    [bidsQuery.data],
  );

  const reviewed = (bidsQuery.data ?? []).filter((bid) => bid.status !== "pending");
  const pending = (bidsQuery.data ?? []).filter((bid) => bid.status === "pending");

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to open your student portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tasks, submissions and reviews all live here once you're signed in.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (isOrganization) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">This portal is for students</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organisation account manages posted tasks and reviews instead.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Go to your dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Student portal</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Hi {displayName} — every posted task is below. Submit a deliverable and follow its review
            without leaving this page.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/profile">My profile</Link>
        </Button>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Tasks submitted", value: bidsQuery.data?.length ?? 0 },
          { label: "Awaiting review", value: pending.length },
          { label: "Reviewed", value: reviewed.length },
        ].map((stat) => (
          <div key={stat.label} className="plate p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardList className="size-4 text-primary" /> All posted tasks
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task titles…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
                  category === item
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {projectsQuery.isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-xl" />
              ))
            : null}
          {projectsQuery.data?.length === 0 ? (
            <p className="plate p-8 text-center text-muted-foreground">
              No tasks match those filters yet.
            </p>
          ) : null}
          {projectsQuery.data?.map((project) => {
            const submitted = submittedIds.has(project.id);
            const expanded = openTask === project.id;
            return (
              <article key={project.id} className="plate p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {project.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.owner_name} · {project.category} · {project.difficulty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-semibold">{formatReward(project.reward)}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" /> due {formatDeadline(project.deadline)}
                    </p>
                  </div>
                </div>

                {project.deliverable ? (
                  <p className="mt-3 line-clamp-2 text-sm">
                    <span className="font-medium">Deliverable: </span>
                    <span className="text-muted-foreground">{project.deliverable}</span>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                  {project.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" className="font-normal">
                      {skill}
                    </Badge>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    {submitted ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        <CheckCircle2 className="size-4" /> Submitted
                      </span>
                    ) : project.status !== "open" ? (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    ) : (
                      <Button
                        size="sm"
                        variant={expanded ? "outline" : "default"}
                        onClick={() => setOpenTask(expanded ? null : project.id)}
                      >
                        {expanded ? "Cancel" : "Submit deliverable"}
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                        View brief
                      </Link>
                    </Button>
                  </div>
                </div>

                {expanded && !submitted ? (
                  <DeliverableSubmitForm
                    projectId={project.id}
                    submissionFormat={project.submission_format}
                    onDone={() => setOpenTask(null)}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold">Your submissions and reviews</h2>
        <div className="mt-4 space-y-3">
          {bidsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
          {bidsQuery.data?.length === 0 ? (
            <p className="plate p-5 text-sm text-muted-foreground">
              Nothing submitted yet — pick a task above and hand in your work.
            </p>
          ) : null}
          {bidsQuery.data?.map((bid) => (
            <article key={bid.id} className="plate p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: bid.project_id }}
                    className="font-semibold hover:text-primary"
                  >
                    {bid.projects?.title ?? "Task"}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {timeAgo(bid.created_at)}
                  </p>
                </div>
                <Badge variant={statusVariant(bid.status)}>
                  {bid.status === "pending" ? "awaiting review" : bid.status}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{bid.proposal}</p>
              {bid.submission_url ? (
                <a
                  href={bid.submission_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-block text-sm font-medium text-primary underline"
                >
                  Open my deliverable
                </a>
              ) : null}
              <SubmissionReviewSummary bid={bid} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
