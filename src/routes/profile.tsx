import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

import { SubmissionReviewSummary } from "@/components/submission-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyBids,
  fetchMyProfile,
  initials,
  RUBRIC_CRITERIA,
  timeAgo,
} from "@/lib/marketplace";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile — SkillSync" },
      {
        name: "description",
        content:
          "Your SkillSync student profile: skills, every deliverable you submitted and the rubric feedback reviewers left.",
      },
      { property: "og:title", content: "My SkillSync profile" },
      {
        property: "og:description",
        content: "Skills, submitted deliverables and reviewer feedback in one profile.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyProfile,
});

function statusVariant(status: string) {
  if (status === "accepted") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

function MyProfile() {
  const { user, displayName } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => fetchMyProfile(user!.id),
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
        <h1 className="text-2xl font-semibold">Sign in to see your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your submissions and reviewer feedback live here.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  const bids = bidsQuery.data ?? [];
  const reviewed = bids.filter((bid) => bid.decision);
  const passed = reviewed.filter((bid) => bid.decision === "pass").length;
  const scored = reviewed.flatMap((bid) =>
    RUBRIC_CRITERIA.map((criterion) => bid[criterion.key]).filter(
      (value): value is number => value != null,
    ),
  );
  const averageScore = scored.length
    ? (scored.reduce((sum, value) => sum + value, 0) / scored.length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="plate flex flex-wrap items-start gap-5 p-6">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {initials(profile?.display_name ?? displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {profile?.display_name ?? displayName}
          </h1>
          {profileQuery.isLoading ? (
            <Skeleton className="mt-2 h-4 w-48" />
          ) : (
            <p className="mt-1 text-muted-foreground">
              {profile?.headline ?? "Student on SkillSync"}
            </p>
          )}
          {profile?.location ? (
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {profile.location}
            </p>
          ) : null}
          {profile?.bio ? (
            <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
          ) : null}
          {profile?.skills?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <Button asChild variant="outline">
          <Link to="/portal">Student portal</Link>
        </Button>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Submissions", value: String(bids.length) },
          { label: "Passed reviews", value: `${passed}/${reviewed.length}` },
          { label: "Average rubric score", value: averageScore ? `${averageScore}/5` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="plate p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 inline-flex items-center gap-1 font-display text-2xl font-semibold">
              {stat.label === "Average rubric score" && averageScore ? (
                <Star className="size-4 text-primary" />
              ) : null}
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Submissions and reviews</h2>
        <div className="mt-4 space-y-3">
          {bidsQuery.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}
          {!bidsQuery.isLoading && bids.length === 0 ? (
            <p className="plate p-5 text-sm text-muted-foreground">
              No submissions yet.{" "}
              <Link to="/portal" className="text-primary underline">
                Open the student portal
              </Link>{" "}
              to hand in your first deliverable.
            </p>
          ) : null}
          {bids.map((bid) => (
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
                    {bid.projects?.category ? `${bid.projects.category} · ` : ""}submitted{" "}
                    {timeAgo(bid.created_at)}
                  </p>
                </div>
                <Badge variant={statusVariant(bid.status)}>
                  {bid.status === "pending" ? "awaiting review" : bid.status}
                </Badge>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                {bid.proposal}
              </p>
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
