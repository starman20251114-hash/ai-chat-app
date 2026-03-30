import { handle } from "hono/vercel";
import app from "../../../src/hono";

export const GET = handle(app);
export const POST = handle(app);
