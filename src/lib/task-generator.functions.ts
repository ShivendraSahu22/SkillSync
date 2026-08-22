import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  skill: z.string().min(2).max(120),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  notes: z.string().max(400).optional(),
});

export const generateTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generateTaskDraft } = await import("./task-generator.server");
    return generateTaskDraft({
      skill: data.skill,
      difficulty: data.difficulty,
      ...(data.notes ? { notes: data.notes } : {}),
    });
  });
