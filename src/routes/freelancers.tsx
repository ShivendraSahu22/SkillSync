import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Search, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFreelancers, initials } from "@/lib/marketplace";

export const Route = createFileRoute("/freelancers")({
  head: () => ({
    meta: [
      { title: "Hire vetted freelancers — SkillSync" },
      {
        name: "description",
        content:
          "Browse freelance developers, designers, data engineers and marketers with ratings, rates and skill sets.",
      },
      { property: "og:title", content: "Hire vetted freelancers" },
      {
        property: "og:description",
        content: "Rates, ratings and skills for freelancers across every discipline.",
      },
    ],
  }),
  component: Freelancers,
});

function Freelancers() {
  const [search, setSearch] = useState("");
  const freelancersQuery = useQuery({
    queryKey: ["freelancers", search],
    queryFn: () => fetchFreelancers({ search }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Hire talent</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Specialists with track records, transparent rates and reviews from real engagements.
        </p>
      </header>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name…"
          className="pl-9"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {freelancersQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-xl" />
            ))
          : null}

        {freelancersQuery.data?.map((profile) => (
          <article key={profile.id} className="plate flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
                {initials(profile.display_name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{profile.display_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {profile.headline ?? "Freelance professional"}
                </p>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
              {profile.bio ?? "No bio yet."}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="font-normal">
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Star className="size-3.5 fill-accent text-accent" />
                {profile.rating.toFixed(1)}
                <span className="text-xs">({profile.reviews_count})</span>
              </span>
              {profile.location ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" /> {profile.location}
                </span>
              ) : null}
              {profile.hourly_rate ? (
                <span className="font-semibold">${profile.hourly_rate}/hr</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
