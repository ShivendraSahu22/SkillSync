import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageCircleMore } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { createChatThread, readChatThreads, writeChatThreads } from "@/lib/chat-storage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI student coach — SkillSync" },
      {
        name: "description",
        content: "Start a private SkillSync AI coaching conversation about task briefs, deliverables, skills and review feedback.",
      },
      { property: "og:title", content: "SkillSync AI student coach" },
      {
        property: "og:description",
        content: "Get practical guidance for understanding briefs, planning deliverables and improving student submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const { user, isStudent, roleLoading, loading } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading || roleLoading || !user || !isStudent) return;
    const existing = readChatThreads();
    const thread = existing[0] ?? createChatThread();
    if (existing.length === 0) writeChatThreads([thread]);
    void navigate({ to: "/chat/$threadId", params: { threadId: thread.id }, replace: true });
    setReady(true);
  }, [isStudent, loading, navigate, roleLoading, user]);

  if (loading || roleLoading || ready) {
    return <div className="mx-auto max-w-6xl px-4 py-12"><Skeleton className="h-[65vh] rounded-lg" /></div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <MessageCircleMore className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Sign in to talk with SkillSync Coach</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your conversations stay saved in this browser.</p>
        <Button className="mt-6" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">The AI coach is for students</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use your organization dashboard to post tasks and review work.</p>
      <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>Go to dashboard</Button>
    </div>
  );
}