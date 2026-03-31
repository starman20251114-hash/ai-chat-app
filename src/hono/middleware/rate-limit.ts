import type { Context, Next } from "hono";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export async function rateLimitMiddleware(c: Context, next: Next) {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
    c.req.header("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  entry.count++;
  return next();
}
