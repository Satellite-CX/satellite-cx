import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string(),
  DISABLE_RLS: z.stringbool().optional(),
  RLS_CLIENT_DATABASE_URL: z.string().optional(),
  API_PORT: z.coerce.number(),
  CORS_ORIGINS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
