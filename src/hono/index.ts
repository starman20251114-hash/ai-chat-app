import { Hono } from "hono";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import chat from "./routes/chat";

const app = new Hono().basePath("/api");

app.use("/chat/*", rateLimitMiddleware);
app.route("/chat", chat);

export default app;
