import { Hono } from "hono";
import type { MessageListInput } from "@mastra/core/agent/message-list";
import { mastra } from "../../mastra";
import type { Message, ImageAttachment, MediaType } from "../../types/chat";

const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 4000;
const MAX_IMAGES_PER_MESSAGE = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB decoded
const ALLOWED_MEDIA_TYPES: MediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type ChatMessage = Pick<Message, "role" | "content" | "images">;

function isValidMediaType(value: unknown): value is MediaType {
  return ALLOWED_MEDIA_TYPES.includes(value as MediaType);
}

function isValidImageAttachment(img: unknown): img is ImageAttachment {
  if (typeof img !== "object" || img === null) return false;
  const i = img as Record<string, unknown>;
  if (!isValidMediaType(i.mediaType)) return false;
  if (typeof i.data !== "string" || i.data.length === 0) return false;
  // Check decoded size: base64 length * 0.75 ≈ byte size
  const approxBytes = Math.ceil(i.data.length * 0.75);
  if (approxBytes > MAX_IMAGE_BYTES) return false;
  return true;
}

function isValidMessage(msg: unknown): msg is ChatMessage {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  if (m.role !== "user" && m.role !== "assistant") return false;
  if (typeof m.content !== "string") return false;
  if (m.content.trim().length === 0) return false;
  if (m.content.length > MAX_CONTENT_LENGTH) return false;

  if (m.images !== undefined) {
    if (!Array.isArray(m.images)) return false;
    if (m.images.length > MAX_IMAGES_PER_MESSAGE) return false;
    if (!m.images.every(isValidImageAttachment)) return false;
  }

  return true;
}

function toMastraMessages(messages: ChatMessage[]): MessageListInput {
  return messages.map((msg) => {
    if (!msg.images || msg.images.length === 0) {
      return { role: msg.role, content: msg.content };
    }
    return {
      role: msg.role,
      content: [
        { type: "text" as const, text: msg.content },
        ...msg.images.map((img) => ({
          type: "image" as const,
          image: img.data,
          mimeType: img.mediaType,
        })),
      ],
    };
  }) as MessageListInput;
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
      {
        error:
          'Each message must have role ("user" | "assistant") and non-empty content string. Images must be JPEG/PNG/GIF/WebP under 5MB (max 5 per message).',
      },
      400
    );
  }

  try {
    const agent = mastra.getAgent("chatAgent");
    const mastraMessages = toMastraMessages(messages as ChatMessage[]);
    const result = await agent.generate(mastraMessages);
    log("info", "chat completed", { messageCount: messages.length });
    return c.json({ message: { role: "assistant", content: result.text } });
  } catch (err) {
    const { status, message } = classifyAgentError(err);
    log("error", "agent error", { status, error: err instanceof Error ? err.message : String(err) });
    return c.json({ error: message }, status);
  }
});

export default chat;
