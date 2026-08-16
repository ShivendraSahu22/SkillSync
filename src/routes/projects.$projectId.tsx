import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, MapPin, Wallet } from "lucide-react";
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
  formatBudget,
  initials,
  timeAgo,
} from "@/lib/marketplace";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project brief and bids — Freelanceo" },
      {
        name: "description",
        content:
          "Read the full project brief, see what other freelancers are bidding and submit your own proposal.",
      },
      { property: "og:title", content: "Project brief and bids" },
      {
        property: "og:description",
        content: "Budget, required skills and live proposals for this freelance project.",
      },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user, displayName } = useAuth();
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });
  const bidsQuery = useQuery({
    queryKey: ["bids", projectId],
    queryFn: () => fetchBidsForProject(projectId),
  });

  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("7");
  const [proposal, setProposal] = useState("");

  const placeBid = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please log in to place a bid.");
      const { error } = await supabase.from("bids").insert({
        project_id: projectId,
        bidder_id: user.id,
        bidder_name: displayName,
        amount: Number(amount),
        delivery_days: Number(days),
        proposal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid submitted.");
      setAmount("");
      setProposal("");
      queryClient.invalidateQueries({ queryKey: ["bids", projectId] });
      queryClient.invalidateQueries({ queryKey: ["bid-counts"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not submit bid"),
  });

  const project = projectQuery.data;
  const bids = bidsQuery.data ?? [];
  const myBid = bids.find((bid) => bid.bidder_id === user?.id);
  const average = bids.length
    ? Math.round(bids.reduce((sum, bid) => sum + Number(bid.amount), 0) / bids.length)
    : 0;

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
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/projects">Back to projects</Link>
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
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <article className="plate p-6">
          <Badge variant="secondary">{project.category}</Badge>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">{project.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Posted by {project.owner_name} · {timeAgo(project.created_at)}
          </p>

          <div className="mt-6 flex flex-wrap gap-6 border-y border-border py-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <strong className="font-semibold">{formatBudget(project)}</strong>
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4 text-primary" />
              {project.budget_type === "hourly" ? "Hourly contract" : "Fixed price"}
            </span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 text-primary" /> Remote
            </span>
          </div>

          <div className="mt-6 whitespace-pre-line text-[15px] leading-relaxed">
            {project.description}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Skills required
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
              Proposals <span className="text-muted-foreground">({bids.length})</span>
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
                    <div className="text-right">
                      <p className="font-semibold">${Number(bid.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">in {bid.delivery_days} days</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{bid.proposal}</p>
                </div>
              ))}
              {bids.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No proposals yet — be the first to bid.
                </p>
              ) : null}
            </div>
          </section>
        </article>

        <aside className="space-y-4">
          <div className="plate p-5">
            <h2 className="font-display text-lg font-semibold">Bid on this project</h2>
            {average ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Average bid so far: ${average.toLocaleString()}
              </p>
            ) : null}

            {!user ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Log in to send a proposal to this client.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Log in to bid</Link>
                </Button>
              </div>
            ) : myBid ? (
              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 text-sm">
                <p className="font-medium">You already bid on this project.</p>
                <p className="mt-1 text-muted-foreground">
                  ${Number(myBid.amount).toLocaleString()} in {myBid.delivery_days} days. Manage it
                  from your dashboard.
                </p>
              </div>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  placeBid.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="amount">Your price (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="2400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Delivery time (days)</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    required
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposal">Proposal</Label>
                  <Textarea
                    id="proposal"
                    required
                    rows={5}
                    value={proposal}
                    onChange={(event) => setProposal(event.target.value)}
                    placeholder="Why you're the right fit, and how you'd approach it."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={placeBid.isPending}>
                  {placeBid.isPending ? "Submitting…" : "Submit bid"}
                </Button>
              </form>
            )}
          </div>

          <div className="plate p-5 text-sm text-muted-foreground">
            <h3 className="font-display text-base font-semibold text-foreground">Bidding tips</h3>
            <ul className="mt-2 space-y-2">
              <li>Reference a comparable project you shipped.</li>
              <li>Break the budget into milestones.</li>
              <li>Ask one sharp question about scope.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
