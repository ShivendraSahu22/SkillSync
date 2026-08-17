import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { CATEGORIES } from "@/lib/marketplace";

export const Route = createFileRoute("/post-project")({
  head: () => ({
    meta: [
      { title: "Post a project — SkillSync" },
      {
        name: "description",
        content:
          "Describe your project, set a budget and start receiving proposals from vetted freelancers within hours.",
      },
      { property: "og:title", content: "Post a project on SkillSync" },
      {
        property: "og:description",
        content: "Publish a brief and collect proposals from freelancers fast.",
      },
    ],
  }),
  component: PostProject,
});

function PostProject() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    budget_type: "fixed",
    budget_min: "500",
    budget_max: "1500",
    skills: "",
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to post a project</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account so freelancers can send you proposals.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in or join free</Link>
        </Button>
      </div>
    );
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
        budget_type: form.budget_type,
        budget_min: Number(form.budget_min) || 0,
        budget_max: Number(form.budget_max) || Number(form.budget_min) || 0,
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
    toast.success("Project published");
    navigate({ to: "/projects/$projectId", params: { projectId: data.id } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">Post a project</h1>
      <p className="mt-2 text-muted-foreground">
        A clear brief gets better proposals. Two minutes is all it takes.
      </p>

      <form onSubmit={onSubmit} className="plate mt-8 space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Project title</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Build a Next.js marketing site"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            rows={7}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Goals, deliverables, timeline, anything a freelancer should know…"
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
            <Label>Budget type</Label>
            <Select
              value={form.budget_type}
              onValueChange={(value) => setForm({ ...form, budget_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed price</SelectItem>
                <SelectItem value="hourly">Hourly rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min">Budget from ($)</Label>
            <Input
              id="min"
              type="number"
              min="0"
              value={form.budget_min}
              onChange={(event) => setForm({ ...form, budget_min: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max">Budget to ($)</Label>
            <Input
              id="max"
              type="number"
              min="0"
              value={form.budget_max}
              onChange={(event) => setForm({ ...form, budget_max: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Input
            id="skills"
            value={form.skills}
            onChange={(event) => setForm({ ...form, skills: event.target.value })}
            placeholder="React, TypeScript, Tailwind"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Publishing…" : "Publish project"}
        </Button>
      </form>
    </div>
  );
}
