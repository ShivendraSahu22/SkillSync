export type GeneratedTask = {
  title: string;
  description: string;
  skills: string[];
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  deliverable: string;
  requirements: string;
  evaluation_criteria: string;
  submission_format: string;
  reward: number;
  deadline_days: number;
};

const SYSTEM_PROMPT = `You design short, clearly scoped, student-friendly micro-tasks for a student task marketplace.

Generate ONLY small standalone tasks built around a specific skill and one well-defined deliverable.

NEVER generate: full-time jobs, long-term projects, internships, multi-day or ongoing work, hourly work or hourly payment, tasks defined by working hours, "complete this in X hours", "work for X hours", or any estimated completion time.

Every task MUST:
- have a clear objective and tightly defined scope
- focus on one specific skill or a small set of closely related skills
- have one concrete, measurable deliverable
- be independent with an obvious completion point
- be realistic for a student as a small standalone task
- be graded on the quality and correctness of the submitted deliverable, never on time spent
- state clear requirements and explicit evaluation criteria (percentage weights summing to 100)
- carry a fixed reward in USD based on difficulty, complexity and deliverable quality, never on hours

Never mention hours, time estimates, effort duration, salary, rates or ongoing commitments anywhere in the output.
Requirements and evaluation criteria must be newline-separated bullet lines beginning with "- ".
Reward guidance: Beginner 20-50, Intermediate 50-120, Advanced 120-250.
deadline_days is a submission due window in days (3-10) — a deadline, not an effort estimate.`;

const CATEGORY_LIST = [
  "Web Development",
  "Design",
  "Mobile",
  "Data",
  "Marketing",
  "Video",
  "Writing",
  "Other",
];

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "emit_task",
    description: "Emit one short, scoped, deliverable-based student task.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        category: { type: "string", enum: CATEGORY_LIST },
        difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
        deliverable: { type: "string" },
        requirements: { type: "string" },
        evaluation_criteria: { type: "string" },
        submission_format: { type: "string" },
        reward: { type: "number" },
        deadline_days: { type: "number" },
      },
      required: [
        "title",
        "description",
        "skills",
        "category",
        "difficulty",
        "deliverable",
        "requirements",
        "evaluation_criteria",
        "submission_format",
        "reward",
        "deadline_days",
      ],
      additionalProperties: false,
    },
  },
} as const;

export async function generateTaskDraft(input: {
  skill: string;
  difficulty: string;
  notes?: string;
}): Promise<GeneratedTask> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Skill focus: ${input.skill}\nDifficulty: ${input.difficulty}${
            input.notes ? `\nExtra context: ${input.notes}` : ""
          }\n\nGenerate exactly one task via the emit_task tool.`,
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "emit_task" } },
    }),
  });

  if (response.status === 429) throw new Error("AI rate limit reached — try again shortly.");
  if (response.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!response.ok) throw new Error(`AI request failed (${response.status}).`);

  const payload = (await response.json()) as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
  };
  const args = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI returned no task.");

  const parsed = JSON.parse(args) as GeneratedTask;
  return {
    ...parsed,
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 6) : [],
    reward: Math.max(10, Math.round(Number(parsed.reward) || 0)),
    deadline_days: Math.min(14, Math.max(2, Math.round(Number(parsed.deadline_days) || 7))),
    category: CATEGORY_LIST.includes(parsed.category) ? parsed.category : "Other",
  };
}
