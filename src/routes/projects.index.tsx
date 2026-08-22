import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, fetchBidCounts, fetchProjects } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Browse freelance projects — SkillSync" },
      {
        name: "description",
        content:
          "Browse open freelance projects in development, design, data, marketing and video. Filter by category and place a bid in minutes.",
      },
      { property: "og:title", content: "Browse freelance projects" },
      {
        property: "og:description",
        content: "Short scoped tasks with one deliverable, fixed rewards and clear evaluation criteria.",
      },
    ],
  }),
  component: BrowseProjects,
});

function BrowseProjects() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const projectsQuery = useQuery({
    queryKey: ["projects", category, search],
    queryFn: () => fetchProjects({ category, search }),
  });
  const bidCountsQuery = useQuery({ queryKey: ["bid-counts"], queryFn: fetchBidCounts });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Find work</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every open project on the marketplace. Filter, read the brief, then send a bid with your
          price and timeline.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search project titles…"
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

      <div className="mt-8 grid gap-4">
        {projectsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-xl" />
            ))
          : null}

        {projectsQuery.data?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            bidCount={bidCountsQuery.data?.[project.id] ?? 0}
          />
        ))}

        {projectsQuery.data?.length === 0 ? (
          <p className="plate p-8 text-center text-muted-foreground">
            No projects match those filters yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
