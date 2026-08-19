import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, FileText } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyBids,
  fetchMyProjects,
  fetchSubmissionsForMyProjects,
  formatBudget,
  initials,
  reviewSubmission,
  timeAgo,
} from "@/lib/marketplace";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — SkillSync" },
      {
        name: "description",
        content:
          "Students track submitted tasks; organizations manage posted work and review student submissions.",
      },
      { property: "og:title", content: "SkillSync dashboard" },
      {
        property: "og:description",
        content: "Posted tasks, student submissions and review decisions at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function statusVariant(status: string) {
  if (status === "accepted") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

function Dashboard() {
  const { user, displayName, isOrganization, isStudent, roleLoading } = useAuth();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: () => fetchMyProjects(user!.id),
    enabled: Boolean(user) && isOrganization,
  });

  const submissionsQuery = useQuery({
    queryKey: ["org-submissions", user?.id],
    queryFn: () => fetchSubmissionsForMyProjects(user!.id),
    enabled: Boolean(user) && isOrganization,
  });

  const bidsQuery = useQuery({
    queryKey: ["my-bids", user?.id],
    queryFn: () => fetchMyBids(user!.id),
    enabled: Boolean(user) && isStudent,
  });

  const review = useMutation({
    mutationFn: ({ bidId, status }: { bidId: string; status: "accepted" | "rejected" }) =>
      reviewSubmission(bidId, status),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.status === "accepted" ? "Submission accepted." : "Submission rejected.",
      );
      queryClient.invalidateQueries({ queryKey: ["org-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["bids"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update submission"),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to see your dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your tasks and submissions live here once you're signed in.
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Welcome back, {displayName}</h1>
          <p className="mt-2 text-muted-foreground">
            {isOrganization
              ? "Manage the work you posted and review student submissions."
              : "Track the tasks you submitted work for."}
          </p>
        </div>
        {isOrganization ? (
          <Button asChild>
            <Link to="/post-project">Post a task</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/projects">Browse tasks</Link>
          </Button>
        )}
      </header>

      {isOrganization ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="size-4 text-primary" /> Tasks you posted
            </h2>
            <div className="mt-4 space-y-3">
              {projectsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
              {projectsQuery.data?.length === 0 ? (
                <p className="plate p-5 text-sm text-muted-foreground">
                  No tasks yet. Post your first brief and student submissions will roll in.
                </p>
              ) : null}
              {projectsQuery.data?.map((project) => (
                <Link
                  key={project.id}
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="plate block p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{project.title}</h3>
                    <Badge variant="secondary">{project.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <p className="mt-3 text-sm font-medium">
                    {formatBudget(project)}{" "}
                    <span className="font-normal text-muted-foreground">
                      · posted {timeAgo(project.created_at)}
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="size-4 text-primary" /> Student submissions
            </h2>
            <div className="mt-4 space-y-3">
              {submissionsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
              {submissionsQuery.data?.length === 0 ? (
                <p className="plate p-5 text-sm text-muted-foreground">
                  No submissions yet on your tasks.
                </p>
              ) : null}
              {submissionsQuery.data?.map((submission) => (
                <article key={submission.id} className="plate p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {initials(submission.bidder_name)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{submission.bidder_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.projects?.title ?? "Task"} · {timeAgo(submission.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(submission.status)}>{submission.status}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {submission.proposal}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ${Number(submission.amount).toLocaleString()} · {submission.delivery_days} day
                    delivery
                  </p>
                  {submission.status === "pending" ? (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ bidId: submission.id, status: "accepted" })}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ bidId: submission.id, status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="size-4 text-primary" /> Work you submitted
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {bidsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
            {bidsQuery.data?.length === 0 ? (
              <p className="plate p-5 text-sm text-muted-foreground">
                No submissions yet.{" "}
                <Link to="/projects" className="text-primary underline">
                  Browse open tasks
                </Link>
                .
              </p>
            ) : null}
            {bidsQuery.data?.map((bid) => (
              <Link
                key={bid.id}
                to="/projects/$projectId"
                params={{ projectId: bid.project_id }}
                className="plate block p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{bid.projects?.title ?? "Task"}</h3>
                  <Badge variant={statusVariant(bid.status)}>{bid.status}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bid.proposal}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  ${Number(bid.amount).toLocaleString()} · {bid.delivery_days} day delivery · sent{" "}
                  {timeAgo(bid.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
