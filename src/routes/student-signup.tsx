import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { saveStudentProfile } from "@/lib/marketplace";

export const Route = createFileRoute("/student-signup")({
  head: () => ({
    meta: [
      { title: "Student sign-up — SkillSync" },
      {
        name: "description",
        content:
          "Create a free SkillSync student account to browse short skill-based tasks, submit deliverables and collect rubric feedback from organizations.",
      },
      { property: "og:title", content: "Create your SkillSync student account" },
      {
        property: "og:description",
        content:
          "Sign up as a student, pick short scoped tasks and get reviewed feedback on every deliverable you hand in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentSignup,
});

const EMPTY = {
  name: "",
  email: "",
  password: "",
  headline: "",
  bio: "",
  location: "",
  skills: "",
};

function StudentSignup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/portal" });
  }, [user, navigate]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            display_name: form.name.trim() || form.email.split("@")[0],
            account_role: "student",
          },
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });
      if (error) throw error;

      if (data.session?.user) {
        await saveStudentProfile(data.session.user.id, {
          display_name: form.name,
          headline: form.headline,
          bio: form.bio,
          location: form.location,
          skills: form.skills,
        });
        toast.success("Welcome to SkillSync! Your student profile is ready.");
        navigate({ to: "/portal" });
        return;
      }

      toast.success("Check your email to confirm your account, then log in.");
      setForm(EMPTY);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid-canvas min-h-[calc(100vh-4rem)] px-4 py-16">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-center text-3xl font-semibold">Create your student account</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Browse short, clearly scoped tasks, hand in deliverables and collect rubric feedback from
          real organizations.
        </p>

        <form onSubmit={handleSubmit} className="plate mt-8 space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Amara Osei"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
                placeholder="you@university.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(event) => set("password", event.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Course or headline</Label>
            <Input
              id="headline"
              maxLength={160}
              value={form.headline}
              onChange={(event) => set("headline", event.target.value)}
              placeholder="3rd-year Computer Science student"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              value={form.skills}
              onChange={(event) => set("skills", event.target.value)}
              placeholder="React, Figma, Copywriting"
            />
            <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Where you study</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(event) => set("location", event.target.value)}
              placeholder="Accra, Ghana"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              rows={4}
              maxLength={1500}
              value={form.bio}
              onChange={(event) => set("bio", event.target.value)}
              placeholder="Share the kind of tasks you want to take on and what you have built so far."
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create student account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-medium text-foreground underline">
              Log in
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Posting tasks is for organizations —{" "}
            <Link to="/auth" className="underline">
              create an organization account
            </Link>{" "}
            instead.
          </p>
        </form>
      </div>
    </div>
  );
}
