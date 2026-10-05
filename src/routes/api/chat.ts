import { createFileRoute } from "@tanstack/react-router";

import { handleSkillCoachChat } from "@/lib/skill-coach.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: ({ request }) => handleSkillCoachChat(request),
    },
  },
});