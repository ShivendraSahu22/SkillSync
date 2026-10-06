import type { UIMessage } from "ai";

export type LocalChatThread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UIMessage[];
};

const STORAGE_KEY = "skillsync-ai-chat-threads-v1";

function validThread(value: unknown): value is LocalChatThread {
  if (!value || typeof value !== "object") return false;
  const thread = value as Partial<LocalChatThread>;
  return (
    typeof thread.id === "string" &&
    /^[a-zA-Z0-9_-]{8,80}$/.test(thread.id) &&
    typeof thread.title === "string" &&
    typeof thread.updatedAt === "string" &&
    Array.isArray(thread.messages)
  );
}

export function readChatThreads() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(validThread) : [];
  } catch {
    return [];
  }
}

export function writeChatThreads(threads: LocalChatThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function createChatThread(): LocalChatThread {
  return {
    id: crypto.randomUUID().replaceAll("-", ""),
    title: "New conversation",
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

export function titleFromMessages(messages: UIMessage[]) {
  const text = messages
    .find((message) => message.role === "user")
    ?.parts.find((part) => part.type === "text")
    ?.text.trim();
  if (!text) return "New conversation";
  return text.length > 42 ? `${text.slice(0, 42).trim()}…` : text;
}
