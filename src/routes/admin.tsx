import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SubmissionReviewSummary } from "@/components/submission-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  adminFetchAllSubmissions,
  adminFetchStudents,
  adminSetApproval,
  adminUpdateTask,
  fetchProjects,
  formatReward,
  timeAgo,
  type Project,
} from "@/lib/marketplace";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel | SkillSync" },
      {
        name: "description",
        content: "Approve student accounts, view every submission and adjust task rewards and deadlines.",
      },
      { property: "og:title", content: "SkillSync admin panel" },
      { property: "og:description", content: "Platform-wide management for SkillSync admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "students" | "submissions" | "tasks";

function AdminPage() {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("students");

  if (loading || roleLoading) return <Skeleton className="mx-auto my-16 h-64 max-w-6xl rounded-xl" />;
  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <ShieldCheck className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-3xl font-semibold">Admins only</h1>
        <p className="mt-3 text-muted-foreground">This area is for SkillSync administrators.</p>
        <Button asChild className="mt-6">
          <Link to={user ? "/" : "/auth"}>{user ? "Back home" : "Sign in"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="size-3.5" /> Admin
      </Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Admin panel</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["students", "Student approvals"],
            ["submissions", "All submissions"],
            ["tasks", "Task rewards & deadlines"],
          ] as const
        ).map(([key, label]) => (
          <Button key={key} variant={tab === key ? "default" : "outline"} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "students" ? <StudentsTab /> : tab === "submissions" ? <SubmissionsTab /> : <TasksTab />}
      </div>
    </div>
  );
}

function StudentsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-students"], queryFn: adminFetchStudents });
  const m = useMutation({
    mutationFn: (v: { userId: string; status: "approved" | "rejected" }) =>
      adminSetApproval(v.userId, v.status),
    onSuccess: () => {
      toast.success("Student updated");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <Skeleton className="h-40 rounded-xl" />;
  const rows = [...(q.data ?? [])].sort(
    (a, b) => Number(b.approval_status === "pending") - Number(a.approval_status === "pending"),
  );
  if (rows.length === 0) return <p className="plate p-8 text-center text-muted-foreground">No students yet.</p>;
  return (
    <div className="grid gap-3">
      {rows.map((p) => (
        <article key={p.id} className="plate flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold">{p.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {p.headline ?? "No headline"} · joined {timeAgo(p.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={p.approval_status === "approved" ? "default" : "outline"} className="capitalize">
              {p.approval_status ?? "approved"}
            </Badge>
            {p.approval_status !== "approved" ? (
              <Button size="sm" disabled={m.isPending} onClick={() => m.mutate({ userId: p.id, status: "approved" })}>
                Approve
              </Button>
            ) : null}
            {p.approval_status !== "rejected" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={m.isPending}
                onClick={() => m.mutate({ userId: p.id, status: "rejected" })}
              >
                Reject
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function SubmissionsTab() {
  const q = useQuery({ queryKey: ["admin-submissions"], queryFn: adminFetchAllSubmissions });
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");
  if (q.isLoading) return <Skeleton className="h-40 rounded-xl" />;
  const rows = (q.data ?? []).filter((s) =>
    filter === "all" ? true : filter === "pending" ? !s.decision : Boolean(s.decision),
  );
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["all", "pending", "reviewed"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} className="capitalize" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="plate p-8 text-center text-muted-foreground">No submissions here.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((s) => (
            <article key={s.id} className="plate p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{s.bidder_name}</p>
                  <p className="text-xs text-muted-foreground">
                    <Link to="/projects/$projectId" params={{ projectId: s.project_id }} className="hover:text-primary">
                      {s.projects?.title ?? "Task"}
                    </Link>{" "}
                    · {s.projects?.owner_name ?? ""} · {timeAgo(s.created_at)}
                  </p>
                </div>
                <Badge variant={s.decision ? "default" : "outline"} className="capitalize">
                  {s.decision ?? "Awaiting review"}
                </Badge>
              </div>
              {s.submission_url ? (
                <a
                  href={s.submission_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Open deliverable <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {s.decision ? (
                <div className="mt-3">
                  <SubmissionReviewSummary bid={s} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab() {
  const q = useQuery({ queryKey: ["projects", "admin"], queryFn: () => fetchProjects({ limit: 200 }) });
  if (q.isLoading) return <Skeleton className="h-40 rounded-xl" />;
  const rows = q.data ?? [];
  if (rows.length === 0) return <p className="plate p-8 text-center text-muted-foreground">No tasks yet.</p>;
  return (
    <div className="grid gap-3">
      {rows.map((p) => (
        <TaskRow key={p.id} project={p} />
      ))}
    </div>
  );
}

function TaskRow({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [reward, setReward] = useState(String(project.reward));
  const [deadline, setDeadline] = useState(project.deadline ?? "");
  const m = useMutation({
    mutationFn: () => adminUpdateTask(project.id, Number(reward), deadline || null),
    onSuccess: () => {
      toast.success("Task updated");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const changed = reward !== String(project.reward) || deadline !== (project.deadline ?? "");
  return (
    <article className="plate flex flex-wrap items-end justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <Link to="/projects/$projectId" params={{ projectId: project.id }} className="font-semibold hover:text-primary">
          {project.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {project.owner_name} · {project.difficulty} · now {formatReward(project.reward)}
        </p>
      </div>
      <label className="text-xs text-muted-foreground">
        Reward ($)
        <Input type="number" min={0} value={reward} onChange={(e) => setReward(e.target.value)} className="mt-1 w-28" />
      </label>
      <label className="text-xs text-muted-foreground">
        Deadline
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-40" />
      </label>
      <Button size="sm" disabled={!changed || m.isPending} onClick={() => m.mutate()}>
        Save
      </Button>
    </article>
  );
}
