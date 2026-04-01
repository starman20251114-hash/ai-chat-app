import { Hono } from "hono";
import type { MessageListInput } from "@mastra/core/agent/message-list";
import { mastra } from "../../mastra";
import type { Message } from "../../types/chat";

const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 4000;

type ChatMessage = Pick<Message, "role" | "content">;

function isValidMessage(msg: unknown): msg is ChatMessage {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.trim().length > 0 &&
    m.content.length <= MAX_CONTENT_LENGTH
  );
}

function log(level: "info" | "warn" | "error", message: string, extra?: object) {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...extra }));
}

function classifyAgentError(err: unknown): { status: 400 | 429 | 500 | 503; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("401") || msg.includes("invalid x-api-key") || msg.includes("authentication")) {
    return { status: 500, message: "AIサービスの認証に失敗しました。管理者にお問い合わせください。" };
  }
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Too Many Requests")) {
    return { status: 429, message: "AIサービスが混雑しています。しばらくしてからお試しください。" };
  }
  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("Service Unavailable")) {
    return { status: 503, message: "AIサービスが一時的に利用できません。しばらくしてからお試しください。" };
  }
  return { status: 500, message: "AIとの通信中にエラーが発生しました。もう一度お試しください。" };
}

const chat = new Hono();

chat.post("/", async (c) => {
  let body: { messages?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON in request body" }, 400);
  }

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages must be a non-empty array" }, 400);
  }

  if (messages.length > MAX_MESSAGES) {
    return c.json({ error: `messages must not exceed ${MAX_MESSAGES} items` }, 400);
  }

  if (!messages.every(isValidMessage)) {
    return c.json(
      { error: 'Each message must have role ("user" | "assistant") and non-empty content string' },
      400
    );
  }

  try {
    const agent = mastra.getAgent("chatAgent");
    const result = await agent.generate(messages as MessageListInput);
    log("info", "chat completed", { messageCount: messages.length });
    return c.json({ message: { role: "assistant", content: result.text } });
  } catch (err) {
    const { status, message } = classifyAgentError(err);
    log("error", "agent error", { status, error: err instanceof Error ? err.message : String(err) });
    return c.json({ error: message }, status);
  }
});

export default chat;
