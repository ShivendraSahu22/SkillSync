import { useChat } from "@ai-sdk/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircleMore, PanelLeft, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import logoAsset from "@/assets/skillsync-logo.png.asset.json";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  createChatThread,
  readChatThreads,
  titleFromMessages,
  writeChatThreads,
  type LocalChatThread,
} from "@/lib/chat-storage";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/chat.$threadId";

const STARTERS = [
  "Help me break down a task brief",
  "Review my deliverable plan",
  "Explain feedback I received",
];

function upsertThread(threads: LocalChatThread[], thread: LocalChatThread) {
  return [thread, ...threads.filter((item) => item.id !== thread.id)].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

export function SkillCoachChatPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { user, session, isStudent, roleLoading, loading } = useAuth();
  const [threads, setThreads] = useState<LocalChatThread[]>([]);
  const [thread, setThread] = useState<LocalChatThread | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = readChatThreads();
    const selected = stored.find((item) => item.id === threadId) ?? null;
    setThreads(stored);
    setThread(selected);
    setStorageReady(true);
  }, [threadId]);

  const saveMessages = useCallback(
    (messages: UIMessage[]) => {
      const updated: LocalChatThread = {
        id: threadId,
        title: titleFromMessages(messages),
        updatedAt: new Date().toISOString(),
        messages,
      };
      setThread(updated);
      setThreads((current) => {
        const next = upsertThread(current, updated);
        writeChatThreads(next);
        return next;
      });
    },
    [threadId],
  );

  const makeThread = useCallback(() => {
    const created = createChatThread();
    const next = upsertThread(threads, created);
    writeChatThreads(next);
    setThreads(next);
    setSidebarOpen(false);
    void navigate({ to: "/chat/$threadId", params: { threadId: created.id } });
  }, [navigate, threads]);

  const deleteThread = useCallback(
    (id: string) => {
      const remaining = threads.filter((item) => item.id !== id);
      if (remaining.length > 0) {
        writeChatThreads(remaining);
        setThreads(remaining);
        if (id === threadId) {
          void navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
        }
        return;
      }
      const replacement = createChatThread();
      writeChatThreads([replacement]);
      setThreads([replacement]);
      void navigate({ to: "/chat/$threadId", params: { threadId: replacement.id } });
    },
    [navigate, threadId, threads],
  );

  if (loading || roleLoading || !storageReady) {
    return <div className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-[70vh] rounded-lg" /></div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sign in to use SkillSync Coach</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your conversations stay saved in this browser.</p>
        <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }
  if (!isStudent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">The AI coach is for students</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use your organization dashboard to post tasks and review work.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Go to dashboard</Link></Button>
      </div>
    );
  }
  if (!thread) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Conversation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been deleted from this browser.</p>
        <Button className="mt-6" onClick={makeThread}>Start a new conversation</Button>
      </div>
    );
  }

  return (
    <SkillCoachWorkspace
      key={thread.id}
      thread={thread}
      threads={threads}
      accessToken={session?.access_token ?? ""}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onNew={makeThread}
      onDelete={deleteThread}
      onMessagesChange={saveMessages}
    />
  );
}

function SkillCoachWorkspace({
  thread,
  threads,
  accessToken,
  sidebarOpen,
  setSidebarOpen,
  onNew,
  onDelete,
  onMessagesChange,
}: {
  thread: LocalChatThread;
  threads: LocalChatThread[];
  accessToken: string;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onMessagesChange: (messages: UIMessage[]) => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId: thread.id },
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    [accessToken, thread.id],
  );
  const { messages, sendMessage, status, stop, error } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onFinish: ({ messages: finishedMessages }) => onMessagesChange(finishedMessages),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") textareaRef.current?.focus();
  }, [status]);

  const submit = async (text: string) => {
    const next = text.trim();
    if (!next || busy) return;
    setInput("");
    const optimistic: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: next }],
    };
    onMessagesChange([...messages, optimistic]);
    await sendMessage({ text: next });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl border-x border-border">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close conversations"
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar p-3 transition-transform md:static md:z-auto md:w-64 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-1 py-2">
          <div className="flex items-center gap-2">
            <img src={logoAsset.url} alt="SkillSync Coach" className="size-8 object-contain" />
            <div>
              <p className="text-sm font-semibold">SkillSync Coach</p>
              <p className="text-xs text-muted-foreground">Saved in this browser</p>
            </div>
          </div>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onNew} title="New conversation">
            <Plus />
          </Button>
        </div>
        <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {threads.map((item) => (
            <div key={item.id} className={cn("group flex items-center rounded-md", item.id === thread.id && "bg-sidebar-accent")}>
              <Link
                to="/chat/$threadId"
                params={{ threadId: item.id }}
                onClick={() => setSidebarOpen(false)}
                className="min-w-0 flex-1 px-3 py-2 text-sm"
              >
                <span className="block truncate font-medium">{item.title}</span>
              </Link>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="mr-1 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={() => onDelete(item.id)}
                title="Delete conversation"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
          <Button type="button" size="icon-sm" variant="ghost" className="md:hidden" onClick={() => setSidebarOpen(true)} title="Conversations">
            <PanelLeft />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold">{thread.title}</h1>
            <p className="text-xs text-muted-foreground">Task planning, submission feedback and skill guidance</p>
          </div>
          <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={onNew}>
            <Plus /> New chat
          </Button>
        </header>

        <Conversation className="h-[calc(100vh-13.5rem)] min-h-[420px]">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-8">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageCircleMore className="size-8 text-primary" />}
                title="What are you working on?"
                description="Ask for help understanding a brief, planning a deliverable or applying review feedback."
              >
                <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
                  <img src={logoAsset.url} alt="SkillSync Coach" className="size-14 object-contain" />
                  <div>
                    <h2 className="font-display text-xl font-semibold">What are you working on?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Ask for help understanding a brief, planning a deliverable or applying review feedback.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {STARTERS.map((starter) => (
                      <Button key={starter} type="button" variant="outline" size="sm" onClick={() => void submit(starter)}>
                        {starter}
                      </Button>
                    ))}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : null}
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") return <MessageResponse key={`${message.id}-text-${index}`}>{part.text}</MessageResponse>;
                    if (part.type === "reasoning") {
                      return (
                        <Reasoning key={`${message.id}-reasoning-${index}`} isStreaming={busy && message.id === messages.at(-1)?.id} defaultOpen={false}>
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))}
            {status === "submitted" ? <Shimmer className="text-sm">Thinking...</Shimmer> : null}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border bg-background p-3 sm:p-4">
          <PromptInput
            className="mx-auto max-w-3xl bg-card"
            onSubmit={({ text }) => void submit(text)}
          >
            <PromptInputTextarea
              ref={textareaRef}
              autoFocus
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a task, deliverable or review…"
              className="min-h-20"
              maxLength={2000}
            />
            <PromptInputFooter className="justify-between">
              <span className="text-xs text-muted-foreground">AI guidance can be wrong. Check the task brief.</span>
              <PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && !busy} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>
    </div>
  );
}