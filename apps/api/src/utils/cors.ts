import { cors } from "hono/cors";

const corsOrigins = process.env.CORS_ORIGINS?.split(",") || [];

export const corsMiddleware = cors({
  origin: corsOrigins,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});
