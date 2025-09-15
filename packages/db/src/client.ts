import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";
import type { DrizzleConfig } from "drizzle-orm";
import { env } from "@repo/validators";

const config = {
  schema,
} satisfies DrizzleConfig<typeof schema>;

// ByPass RLS
export const adminDB = drizzle({
  client: postgres(env.ADMIN_DATABASE_URL, { prepare: false }),
  ...config,
});

// Protected by RLS
export const clientDB = drizzle({
  client: postgres(env.RLS_DATABASE_URL, { prepare: false }),
  ...config,
});
