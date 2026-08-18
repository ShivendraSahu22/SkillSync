import { supabase } from "@/integrations/supabase/client";

export type Project = {
  id: string;
  owner_id: string | null;
  owner_name: string;
  title: string;
  description: string;
  category: string;
  budget_type: string;
  budget_min: number;
  budget_max: number;
  skills: string[];
  status: string;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string | null;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  hourly_rate: number | null;
  skills: string[];
  rating: number;
  reviews_count: number;
  account_role: string;
};

export type Bid = {
  id: string;
  project_id: string;
  bidder_id: string;
  bidder_name: string;
  amount: number;
  delivery_days: number;
  proposal: string;
  created_at: string;
};

export const CATEGORIES = [
  "Web Development",
  "Design",
  "Mobile",
  "Data",
  "Marketing",
  "Video",
  "Writing",
  "Other",
] as const;

export async function fetchProjects(options?: { category?: string; search?: string; limit?: number }) {
  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 60);

  if (options?.category && options.category !== "All") {
    query = query.eq("category", options.category);
  }
  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function fetchProject(id: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Project | null;
}

export async function fetchFreelancers(options?: { search?: string; limit?: number }) {
  let query = supabase
    .from("profiles")
    .select("*")
    .order("rating", { ascending: false })
    .limit(options?.limit ?? 60);
  if (options?.search) {
    query = query.ilike("display_name", `%${options.search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function fetchBidsForProject(projectId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bid[];
}

export async function fetchBidCounts() {
  const { data, error } = await supabase.from("bids").select("project_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { project_id: string }[]) {
    counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchMyBids(userId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("*, projects(title, category, status)")
    .eq("bidder_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Bid & { projects: { title: string; category: string; status: string } | null })[];
}

export async function fetchMyProjects(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Project[];
}

export function formatBudget(project: Pick<Project, "budget_type" | "budget_min" | "budget_max">) {
  const suffix = project.budget_type === "hourly" ? "/hr" : "";
  if (project.budget_min === project.budget_max) {
    return `$${project.budget_min.toLocaleString()}${suffix}`;
  }
  return `$${project.budget_min.toLocaleString()} – $${project.budget_max.toLocaleString()}${suffix}`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export type AccountRole = "student" | "organization";

export type Submission = Bid & { status: string; reviewed_at: string | null };

export async function fetchMyRole(userId: string): Promise<AccountRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  const roles = (data ?? []).map((row) => row.role as AccountRole);
  if (roles.includes("organization")) return "organization";
  if (roles.includes("student")) return "student";
  return null;
}

export async function fetchSubmissionsForMyProjects(userId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("*, projects!inner(id, title, owner_id, status)")
    .eq("projects.owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Submission & {
    projects: { id: string; title: string; owner_id: string | null; status: string } | null;
  })[];
}

export async function reviewSubmission(bidId: string, status: "accepted" | "rejected") {
  const { error } = await supabase.from("bids").update({ status }).eq("id", bidId);
  if (error) throw error;
}
