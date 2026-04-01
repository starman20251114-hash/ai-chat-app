import { Hono } from "hono";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import chat from "./routes/chat";
import health from "./routes/health";

const app = new Hono().basePath("/api");

app.route("/health", health);
app.use("/chat/*", rateLimitMiddleware);
app.route("/chat", chat);

export default app;
