import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDeadline, formatReward, timeAgo, type Project } from "@/lib/marketplace";

export function ProjectCard({ project, bidCount = 0 }: { project: Project; bidCount?: number }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="plate group block p-5 transition-shadow hover:shadow-lift"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
            {project.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.owner_name} · {project.category}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-base font-semibold">{formatReward(project.reward)}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.difficulty}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

      {project.deliverable ? (
        <p className="mt-3 line-clamp-2 text-sm">
          <span className="font-medium">Deliverable: </span>
          <span className="text-muted-foreground">{project.deliverable}</span>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} variant="secondary" className="font-normal">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {timeAgo(project.created_at)}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" /> due {formatDeadline(project.deadline)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" /> {bidCount}{" "}
          {bidCount === 1 ? "submission" : "submissions"}
        </span>
        <span className="ml-auto font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View task →
        </span>
      </div>
    </Link>
  );
}
