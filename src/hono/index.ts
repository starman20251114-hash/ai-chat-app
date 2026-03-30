import { Hono } from "hono";
import chat from "./routes/chat";

const app = new Hono().basePath("/api");

app.route("/chat", chat);

export default app;
