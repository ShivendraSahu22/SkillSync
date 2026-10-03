import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  description: z.string().trim().min(20).max(800),
});

export const matchStudentTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isStudent, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "student",
    });
    if (roleError) throw roleError;
    if (!isStudent) throw new Error("AI task matching is available to student accounts only.");

    const [profileResult, bidsResult, projectsResult] = await Promise.all([
      context.supabase.from("profiles").select("skills").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("bids").select("project_id").eq("bidder_id", context.userId),
      context.supabase
        .from("projects")
        .select("id, title, description, category, skills, difficulty, deliverable, requirements")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (bidsResult.error) throw bidsResult.error;
    if (projectsResult.error) throw projectsResult.error;

    const submittedIds = new Set((bidsResult.data ?? []).map((bid) => bid.project_id));
    const candidates = (projectsResult.data ?? []).filter((project) => !submittedIds.has(project.id));
    if (candidates.length === 0) return { recommendations: [] };

    const request = getRequest();
    const initialRunId = request?.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
    const { rankTasksWithAi } = await import("./task-matcher.server");
    const result = await rankTasksWithAi({
      description: data.description,
      profileSkills: profileResult.data?.skills ?? [],
      candidates,
      initialRunId,
    });

    if (result.runId) setResponseHeader("X-Lovable-AIG-Run-ID", result.runId);
    setResponseHeader("Cache-Control", "private, no-store");
    return { recommendations: result.recommendations };
  });
