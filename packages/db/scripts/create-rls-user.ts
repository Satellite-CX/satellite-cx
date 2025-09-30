import { sql } from "drizzle-orm";
import { adminDB } from "../src/client";
import { env } from "@repo/validators";

if (env.DISABLE_RLS) {
  console.log("RLS is disabled, skipping...");
  process.exit(0);
}

const rlsUser = env.POSTGRES_RLS_USER!;
const rlsPassword = env.POSTGRES_RLS_PASSWORD!;

try {
  const res = await adminDB.execute(sql`
    CREATE USER ${sql.raw(rlsUser)}
    WITH
      LOGIN PASSWORD ${sql.raw(`'${rlsPassword}'`)};

    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${sql.raw(rlsUser)};
    `);

  console.log("RLS user created:", res);
  process.exit(0);
} catch (error: unknown) {
  if (error instanceof Error && error.message.includes("42710")) {
    // User already exists, just grant privileges
    console.log("RLS user already exists, granting privileges...");
    await adminDB.execute(sql`
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${sql.raw(rlsUser)};
      `);
    process.exit(0);
  } else {
    throw error;
  }
}
