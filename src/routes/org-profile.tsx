import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyProfile, saveOrganizationProfile } from "@/lib/marketplace";

export const Route = createFileRoute("/org-profile")({
  head: () => ({
    meta: [
      { title: "Organization profile — SkillSync" },
      {
        name: "description",
        content:
          "Set your organization name, description and contact details so student submissions reach the right person.",
      },
      { property: "og:title", content: "Organization profile on SkillSync" },
      {
        property: "og:description",
        content: "Name, description and contact details students see on your posted tasks.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrgProfile,
});

const EMPTY = {
  display_name: "",
  headline: "",
  bio: "",
  location: "",
  contact_email: "",
  contact_phone: "",
  website: "",
};

function OrgProfile() {
  const { user, displayName, isOrganization, roleLoading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const profileQuery = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: Boolean(user),
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      contact_email: profile.contact_email ?? "",
      contact_phone: profile.contact_phone ?? "",
      website: profile.website ?? "",
    });
  }, [profileQuery.data]);

  const save = useMutation({
    mutationFn: () => saveOrganizationProfile(user!.id, form),
    onSuccess: () => {
      toast.success("Organization profile saved.");
      queryClient.invalidateQueries({ queryKey: ["my-profile", user?.id] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save your profile"),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to edit your organization</h1>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
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
        <h1 className="text-2xl font-semibold">This page is for organizations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your student profile lives on a separate page.
        </p>
        <Button asChild className="mt-6">
          <Link to="/profile">Go to my profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">Organization profile</h1>
      <p className="mt-2 text-muted-foreground">
        Students see this on every task you post, so they know who they are building for and who to
        contact about a submission.
      </p>

      <form
        className="plate mt-8 space-y-5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            required
            maxLength={100}
            value={form.display_name}
            onChange={(event) => setForm({ ...form, display_name: event.target.value })}
            placeholder={displayName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-headline">Short tagline</Label>
          <Input
            id="org-headline"
            maxLength={160}
            value={form.headline}
            onChange={(event) => setForm({ ...form, headline: event.target.value })}
            placeholder="Early-stage climate analytics team"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-bio">Description</Label>
          <Textarea
            id="org-bio"
            rows={5}
            maxLength={1500}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
            placeholder="What your team does, the kind of tasks you post and what good work looks like to you."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-email">Contact email</Label>
            <Input
              id="org-email"
              type="email"
              required
              value={form.contact_email}
              onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
              placeholder="reviews@yourteam.com"
            />
            <p className="text-xs text-muted-foreground">
              Where students should follow up about a submission.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-phone">Contact phone (optional)</Label>
            <Input
              id="org-phone"
              maxLength={40}
              value={form.contact_phone}
              onChange={(event) => setForm({ ...form, contact_phone: event.target.value })}
              placeholder="+1 555 010 2020"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-website">Website (optional)</Label>
            <Input
              id="org-website"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              placeholder="https://yourteam.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-location">Location (optional)</Label>
            <Input
              id="org-location"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="Berlin, Germany"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending || profileQuery.isLoading}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
