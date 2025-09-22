import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string(),
  DISABLE_RLS: z.stringbool().optional(),
  RLS_CLIENT_DATABASE_URL: z.string().optional(),
  POSTGRES_RLS_USER: z.string().optional(),
  POSTGRES_RLS_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
