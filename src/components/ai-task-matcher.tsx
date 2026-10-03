import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BrainCircuit, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDeadline, formatReward, type Project } from "@/lib/marketplace";
import { matchStudentTasks } from "@/lib/task-matcher.functions";

type Props = {
  projects: Project[];
  profileSkills: string[];
};

export function AiTaskMatcher({ projects, profileSkills }: Props) {
  const matchTasks = useServerFn(matchStudentTasks);
  const [description, setDescription] = useState("");
  const [matches, setMatches] = useState<
    { projectId: string; score: number; explanation: string; matchedOn: string[] }[]
  >([]);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const visibleMatches = matches
    .map((match) => ({ match, project: projectById.get(match.projectId) }))
    .filter((item): item is { match: (typeof matches)[number]; project: Project } => Boolean(item.project));

  async function handleMatch() {
    const trimmed = description.trim();
    if (trimmed.length < 20) {
      setError("Tell us a little more — use at least 20 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await matchTasks({ data: { description: trimmed } });
      setMatches(result.recommendations);
      setHasRun(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI matching could not be completed right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-y border-border bg-secondary/45">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.4fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3.5" /> AI task matching
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Find work that fits you</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Describe what you know, what you enjoy, and the kind of deliverable you want to create.
              SkillSync will rank the best open tasks and explain each choice.
            </p>
            {profileSkills.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {profileSkills.slice(0, 8).map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="plate p-5 sm:p-6">
            <label htmlFor="student-match-description" className="text-sm font-medium">
              Your skills and interests
            </label>
            <Textarea
              id="student-match-description"
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 800))}
              placeholder="I enjoy designing clean mobile interfaces, use Figma confidently, and want a beginner-friendly task with a visual deliverable."
              className="mt-2 min-h-32 resize-y"
              disabled={loading}
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Include tools, topics, and the kind of work you want to make.</span>
              <span>{description.length}/800</span>
            </div>

            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Couldn’t find matches</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={handleMatch} disabled={loading || projects.length === 0}>
                {loading ? <LoaderCircle className="animate-spin" /> : <BrainCircuit />}
                {loading ? "Finding your best tasks…" : hasRun ? "Match again" : "Find my best tasks"}
              </Button>
              {hasRun ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMatches([]);
                    setHasRun(false);
                    setError("");
                  }}
                >
                  <RotateCcw /> Reset
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {hasRun ? (
          <div className="mt-8" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">Your AI matches</p>
                <h3 className="mt-1 text-xl font-semibold">
                  {visibleMatches.length > 0 ? "Best open tasks for you" : "No strong match yet"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">Recommendations use your description and current profile skills.</p>
            </div>

            {visibleMatches.length === 0 ? (
              <div className="plate mt-4 p-6 text-sm text-muted-foreground">
                Try adding specific tools, subjects, or deliverables you would enjoy creating.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {visibleMatches.map(({ match, project }, index) => (
                  <article key={project.id} className="plate flex flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-primary">#{index + 1} match</p>
                        <h4 className="mt-1 text-lg font-semibold">{project.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.category} · {project.difficulty} · {formatReward(project.reward)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-2xl font-semibold text-primary">{match.score}%</p>
                        <p className="text-xs text-muted-foreground">match</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{match.explanation}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {match.matchedOn.map((item) => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                      <span>Due {formatDeadline(project.deadline)}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                          View task <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
