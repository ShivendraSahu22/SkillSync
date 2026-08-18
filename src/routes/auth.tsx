import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in or join — SkillSync marketplace" },
      {
        name: "description",
        content:
          "Create a SkillSync account to post projects, bid on work and manage your freelance pipeline.",
      },
      { property: "og:title", content: "Log in or join SkillSync" },
      {
        property: "og:description",
        content: "One account for hiring talent and winning freelance work.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "student" | "organization";

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [accountRole, setAccountRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name || email.split("@")[0],
              account_role: accountRole,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success(
          accountRole === "organization"
            ? "Organization account created. You can post work now."
            : "Student account created. Start completing tasks!",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid-canvas min-h-[calc(100vh-4rem)] px-4 py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-center text-3xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Students complete tasks. Organizations post work and review submissions.
        </p>

        <div className="plate mt-8 p-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label>I am joining as</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        {
                          value: "student" as Role,
                          title: "Student",
                          hint: "Browse tasks and submit work",
                        },
                        {
                          value: "organization" as Role,
                          title: "Organization",
                          hint: "Post tasks and review submissions",
                        },
                      ]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={accountRole === option.value}
                        onClick={() => setAccountRole(option.value)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          accountRole === option.value
                            ? "border-primary bg-secondary"
                            : "border-border hover:bg-secondary/60"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{option.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {accountRole === "organization" ? "Organization name" : "Display name"}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={accountRole === "organization" ? "Northwind Labs" : "Amara Osei"}
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@studio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
