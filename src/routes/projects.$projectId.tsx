import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Gauge, Target, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchBidsForProject,
  fetchProject,
  formatDeadline,
  formatReward,
  initials,
  reviewSubmission,
  timeAgo,
} from "@/lib/marketplace";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Task brief and submissions — SkillSync" },
      {
        name: "description",
        content:
          "Read the full task brief: deliverable, requirements, evaluation criteria, submission format, fixed reward and deadline.",
      },
      { property: "og:title", content: "Task brief and submissions" },
      {
        property: "og:description",
        content: "One deliverable, clear evaluation criteria and a fixed reward.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectDetail,
});

function Block({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{body}</div>
    </div>
  );
}

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user, displayName, isStudent, isOrganization, roleLoading } = useAuth();
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });
  const bidsQuery = useQuery({
    queryKey: ["bids", projectId],
    queryFn: () => fetchBidsForProject(projectId),
    enabled: Boolean(user),
  });

  const [submissionUrl, setSubmissionUrl] = useState("");
  const [proposal, setProposal] = useState("");

  const submitWork = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please log in to submit your work.");
      const { error } = await supabase.from("bids").insert({
        project_id: projectId,
        bidder_id: user.id,
        bidder_name: displayName,
        submission_url: submissionUrl.trim(),
        proposal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work submitted for review.");
      setSubmissionUrl("");
      setProposal("");
      queryClient.invalidateQueries({ queryKey: ["bids", projectId] });
      queryClient.invalidateQueries({ queryKey: ["bid-counts"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not submit work"),
  });

  const review = useMutation({
    mutationFn: ({ bidId, status }: { bidId: string; status: "accepted" | "rejected" }) =>
      reviewSubmission(bidId, status),
    onSuccess: (_data, variables) => {
      toast.success(variables.status === "accepted" ? "Submission accepted." : "Submission rejected.");
      queryClient.invalidateQueries({ queryKey: ["bids", projectId] });
      queryClient.invalidateQueries({ queryKey: ["org-submissions"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update submission"),
  });

  const project = projectQuery.data;
  const bids = bidsQuery.data ?? [];
  const isOwner = Boolean(user && project && project.owner_id === user.id);
  const mySubmission = bids.find((bid) => bid.bidder_id === user?.id);

  if (projectQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Task not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/projects">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All tasks
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <article className="plate p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{project.category}</Badge>
            <Badge variant="outline">{project.difficulty}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">{project.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Posted by {project.owner_name} · {timeAgo(project.created_at)}
          </p>

          <div className="mt-6 flex flex-wrap gap-6 border-y border-border py-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <strong className="font-semibold">{formatReward(project.reward)}</strong>
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Gauge className="size-4 text-primary" /> {project.difficulty}
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4 text-primary" /> Due{" "}
              {formatDeadline(project.deadline)}
            </span>
          </div>

          <div className="mt-6 whitespace-pre-line text-[15px] leading-relaxed">
            {project.description}
          </div>

          <Block title="Deliverable" body={project.deliverable} />
          <Block title="Requirements" body={project.requirements} />
          <Block title="Evaluation criteria" body={project.evaluation_criteria} />
          <Block title="Submission format" body={project.submission_format} />

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Skill tags
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">
              {isOwner ? "Submissions" : "Your submission"}{" "}
              <span className="text-muted-foreground">({bids.length})</span>
            </h2>
            <div className="mt-4 space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="rounded-lg border border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {initials(bid.bidder_name)}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{bid.bidder_name}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(bid.created_at)}</p>
                      </div>
                    </div>
                    {bid.submission_url ? (
                      <a
                        href={bid.submission_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm font-medium text-primary underline"
                      >
                        Open deliverable
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{bid.proposal}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        bid.status === "accepted"
                          ? "default"
                          : bid.status === "rejected"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {bid.status}
                    </Badge>
                    {isOwner && isOrganization && bid.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={review.isPending}
                          onClick={() => review.mutate({ bidId: bid.id, status: "accepted" })}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={review.isPending}
                          onClick={() => review.mutate({ bidId: bid.id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
              {bids.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isOwner
                    ? "No submissions on this task yet."
                    : user
                      ? "You have not submitted work for this task yet."
                      : "Sign in to see your submissions for this task."}
                </p>
              ) : null}
            </div>
          </section>
        </article>

        <aside className="space-y-4">
          <div className="plate p-5">
            <h2 className="font-display text-lg font-semibold">Submit your deliverable</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fixed reward: {formatReward(project.reward)} · due {formatDeadline(project.deadline)}
            </p>

            {!user ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Log in as a student to submit your work for this task.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Log in to submit</Link>
                </Button>
              </div>
            ) : roleLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Checking access…</p>
            ) : !isStudent ? (
              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                Organization accounts review submissions — only students can submit work.
              </div>
            ) : mySubmission ? (
              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 text-sm">
                <p className="font-medium">You already submitted work for this task.</p>
                <p className="mt-1 text-muted-foreground">
                  Status: {mySubmission.status}. Track it from your dashboard.
                </p>
              </div>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitWork.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="url">Deliverable link</Label>
                  <Input
                    id="url"
                    type="url"
                    required
                    value={submissionUrl}
                    onChange={(event) => setSubmissionUrl(event.target.value)}
                    placeholder="https://github.com/you/task-solution"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected format: {project.submission_format}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposal">Submission notes</Label>
                  <Textarea
                    id="proposal"
                    required
                    rows={5}
                    value={proposal}
                    onChange={(event) => setProposal(event.target.value)}
                    placeholder="What you built, how each requirement is met, anything to review first."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitWork.isPending}>
                  {submitWork.isPending ? "Submitting…" : "Submit work"}
                </Button>
              </form>
            )}
          </div>

          <div className="plate p-5 text-sm text-muted-foreground">
            <h3 className="font-display flex items-center gap-2 text-base font-semibold text-foreground">
              <Target className="size-4 text-primary" /> Scoring tips
            </h3>
            <ul className="mt-2 space-y-2">
              <li>Match the deliverable exactly — nothing more, nothing less.</li>
              <li>Walk through each requirement in your notes.</li>
              <li>Make the link openable without a login request.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
