import { Hono } from "hono";
import type { MessageListInput } from "@mastra/core/agent/message-list";
import { mastra } from "../../mastra";
import type { Message } from "../../types/chat";

const MAX_MESSAGES = 100;

type ChatMessage = Pick<Message, "role" | "content">;

function isValidMessage(msg: unknown): msg is ChatMessage {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.trim().length > 0
  );
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
    return c.json(
      { error: `messages must not exceed ${MAX_MESSAGES} items` },
      400
    );
  }

  if (!messages.every(isValidMessage)) {
    return c.json(
      {
        error:
          'Each message must have role ("user" | "assistant") and non-empty content string',
      },
      400
    );
  }

  try {
    const agent = mastra.getAgent("chatAgent");
    const result = await agent.generate(messages as MessageListInput);

    return c.json({
      message: {
        role: "assistant",
        content: result.text,
      },
    });
  } catch (err) {
    console.error("[chat] agent error:", err);
    return c.json({ error: "AI agent error" }, 500);
  }
});

export default chat;
