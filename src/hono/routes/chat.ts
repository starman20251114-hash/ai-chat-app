import { Hono } from "hono";
import type { MessageListInput } from "@mastra/core/agent/message-list";
import { mastra } from "../../mastra";
import type { Message } from "../../types/chat";

type ChatRequestBody = {
  messages: Pick<Message, "role" | "content">[];
};

const chat = new Hono();

chat.post("/", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  const { messages } = body;

  if (!messages || messages.length === 0) {
    return c.json({ error: "messages is required" }, 400);
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
