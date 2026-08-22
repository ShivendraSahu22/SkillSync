import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, DIFFICULTIES, type Difficulty } from "@/lib/marketplace";
import { generateTask } from "@/lib/task-generator.functions";

export const Route = createFileRoute("/post-project")({
  head: () => ({
    meta: [
      { title: "Post a student task — SkillSync" },
      {
        name: "description",
        content:
          "Publish a short, clearly scoped task with one deliverable, explicit evaluation criteria and a fixed reward.",
      },
      { property: "og:title", content: "Post a student task on SkillSync" },
      {
        property: "og:description",
        content: "Small scoped tasks, one deliverable, fixed reward — no hourly work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostProject,
});

function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function PostProject() {
  const { user, displayName, isOrganization, roleLoading } = useAuth();
  const navigate = useNavigate();
  const draftTask = useServerFn(generateTask);
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [aiSkill, setAiSkill] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    difficulty: "Beginner" as Difficulty,
    deliverable: "",
    requirements: "",
    evaluation_criteria: "",
    submission_format: "Public link (GitHub / Drive / Figma)",
    reward: "45",
    deadline: defaultDeadline(),
    skills: "",
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to post a task</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only organization accounts can publish work for students.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in or join free</Link>
        </Button>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!isOrganization) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Students can't post tasks</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is a student account. You can browse open tasks and submit your work — posting
          new tasks is reserved for organizations.
        </p>
        <Button asChild className="mt-6">
          <Link to="/projects">Browse tasks</Link>
        </Button>
      </div>
    );
  }

  async function onGenerate() {
    if (!aiSkill.trim()) {
      toast.error("Name the skill the task should focus on.");
      return;
    }
    setDrafting(true);
    try {
      const draft = await draftTask({
        data: { skill: aiSkill.trim(), difficulty: form.difficulty },
      });
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + draft.deadline_days);
      setForm({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        difficulty: draft.difficulty,
        deliverable: draft.deliverable,
        requirements: draft.requirements,
        evaluation_criteria: draft.evaluation_criteria,
        submission_format: draft.submission_format,
        reward: String(draft.reward),
        deadline: deadline.toISOString().slice(0, 10),
        skills: draft.skills.join(", "),
      });
      toast.success("Draft ready — review and publish.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not draft a task");
    } finally {
      setDrafting(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        owner_name: displayName,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        deliverable: form.deliverable.trim(),
        requirements: form.requirements.trim(),
        evaluation_criteria: form.evaluation_criteria.trim(),
        submission_format: form.submission_format.trim(),
        reward: Number(form.reward) || 0,
        deadline: form.deadline || null,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task published");
    navigate({ to: "/projects/$projectId", params: { projectId: data.id } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">Post a task</h1>
      <p className="mt-2 text-muted-foreground">
        Short, scoped, one deliverable. Rewards are fixed and based on difficulty and deliverable
        quality — never on hours worked.
      </p>

      <div className="plate mt-8 space-y-3 p-5">
        <Label htmlFor="ai-skill" className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Draft a task from a skill
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="ai-skill"
            value={aiSkill}
            onChange={(event) => setAiSkill(event.target.value)}
            placeholder="e.g. Figma auto-layout, pandas, React forms"
          />
          <Button type="button" variant="outline" onClick={onGenerate} disabled={drafting}>
            {drafting ? "Drafting…" : "Generate draft"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Generates a single small task with one measurable deliverable, clear requirements,
          evaluation criteria and a fixed reward.
        </p>
      </div>

      <form onSubmit={onSubmit} className="plate mt-6 space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Task title</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Build a responsive pricing section in React + Tailwind"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Task description</Label>
          <Textarea
            id="description"
            required
            rows={5}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Objective and exact scope — what is in, what is out."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty level</Label>
            <Select
              value={form.difficulty}
              onValueChange={(value) => setForm({ ...form, difficulty: value as Difficulty })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliverable">Deliverable</Label>
          <Textarea
            id="deliverable"
            required
            rows={3}
            value={form.deliverable}
            onChange={(event) => setForm({ ...form, deliverable: event.target.value })}
            placeholder="One concrete, measurable output — e.g. one component file plus 2 screenshots."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea
            id="requirements"
            required
            rows={5}
            value={form.requirements}
            onChange={(event) => setForm({ ...form, requirements: event.target.value })}
            placeholder={"- Use React and Tailwind only\n- Works at 375px and 1280px"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="criteria">Evaluation criteria</Label>
          <Textarea
            id="criteria"
            required
            rows={5}
            value={form.evaluation_criteria}
            onChange={(event) => setForm({ ...form, evaluation_criteria: event.target.value })}
            placeholder={"- Correctness (40%)\n- Code quality (30%)\n- Visual polish (30%)"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="format">Submission format</Label>
            <Input
              id="format"
              required
              value={form.submission_format}
              onChange={(event) => setForm({ ...form, submission_format: event.target.value })}
              placeholder="GitHub link, PDF, Figma link…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward">Fixed reward (USD)</Label>
            <Input
              id="reward"
              type="number"
              min="0"
              required
              value={form.reward}
              onChange={(event) => setForm({ ...form, reward: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Submission deadline</Label>
            <Input
              id="deadline"
              type="date"
              required
              value={form.deadline}
              onChange={(event) => setForm({ ...form, deadline: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skill tags (comma separated)</Label>
            <Input
              id="skills"
              value={form.skills}
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
              placeholder="React, Tailwind CSS"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Publishing…" : "Publish task"}
        </Button>
      </form>
    </div>
  );
}
