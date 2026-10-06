import { createFileRoute } from "@tanstack/react-router";

import { SkillCoachChatPage } from "@/components/skill-coach-chat-page";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation with SkillSync Coach" },
      {
        name: "description",
        content: "A private AI coaching conversation for understanding tasks, planning deliverables and applying review feedback.",
      },
      { property: "og:title", content: "Conversation with SkillSync Coach" },
      {
        property: "og:description",
        content: "Practical guidance for student tasks, deliverables, skills and rubric feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkillCoachChatPage,
});