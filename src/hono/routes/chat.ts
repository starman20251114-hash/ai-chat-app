import { Hono } from "hono";
import { mastra } from "../../mastra";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages: Message[];
};

const chat = new Hono();

chat.post("/", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  const { messages } = body;

  if (!messages || messages.length === 0) {
    return c.json({ error: "messages is required" }, 400);
  }

  const agent = mastra.getAgent("chatAgent");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await agent.generate(messages as any);

  return c.json({
    message: {
      role: "assistant",
      content: result.text,
    },
  });
});

export default chat;
