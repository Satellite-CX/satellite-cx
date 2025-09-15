import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  ADMIN_DATABASE_URL: z.string(),
  RLS_DATABASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
