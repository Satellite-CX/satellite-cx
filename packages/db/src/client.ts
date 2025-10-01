import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";
import type { DrizzleConfig } from "drizzle-orm";

const config = {
  schema,
} satisfies DrizzleConfig<typeof schema>;

// ByPass RLS
export const adminDB = drizzle({
  client: postgres(process.env.DATABASE_URL!, { prepare: false }),
  ...config,
});

// Protected by RLS
export const clientDB = process.env.DISABLE_RLS === "true"
  ? adminDB
  : drizzle({
      client: postgres(process.env.RLS_CLIENT_DATABASE_URL!, {
        prepare: false,
      }),
      ...config,
    });
