import { cors } from "hono/cors";
import { env } from "@repo/validators";

const corsOrigins = env.CORS_ORIGINS?.split(",") || [];

export const corsMiddleware = cors({
  origin: corsOrigins,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});
