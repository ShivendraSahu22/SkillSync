import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyBids, fetchMyProjects, formatBudget, timeAgo } from "@/lib/marketplace";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Freelanceo" },
      {
        name: "description",
        content: "Track the projects you posted and the proposals you sent in one workspace.",
      },
      { property: "og:title", content: "Freelanceo dashboard" },
      {
        property: "og:description",
        content: "Your posted projects and submitted proposals at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, displayName } = useAuth();

  const projectsQuery = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: () => fetchMyProjects(user!.id),
    enabled: Boolean(user),
  });

  const bidsQuery = useQuery({
    queryKey: ["my-bids", user?.id],
    queryFn: () => fetchMyBids(user!.id),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to see your dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your projects and proposals live here once you're signed in.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Welcome back, {displayName}</h1>
          <p className="mt-2 text-muted-foreground">Your projects and proposals in one place.</p>
        </div>
        <Button asChild>
          <Link to="/post-project">Post a project</Link>
        </Button>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="size-4 text-primary" /> Projects you posted
          </h2>
          <div className="mt-4 space-y-3">
            {projectsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
            {projectsQuery.data?.length === 0 ? (
              <p className="plate p-5 text-sm text-muted-foreground">
                No projects yet. Post your first brief and proposals will roll in.
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
            <FileText className="size-4 text-primary" /> Proposals you sent
          </h2>
          <div className="mt-4 space-y-3">
            {bidsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
            {bidsQuery.data?.length === 0 ? (
              <p className="plate p-5 text-sm text-muted-foreground">
                No proposals yet.{" "}
                <Link to="/projects" className="text-primary underline">
                  Browse open projects
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
                  <h3 className="font-semibold">{bid.projects?.title ?? "Project"}</h3>
                  <Badge variant="secondary">${bid.amount.toLocaleString()}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bid.proposal}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {bid.delivery_days} day delivery · sent {timeAgo(bid.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
