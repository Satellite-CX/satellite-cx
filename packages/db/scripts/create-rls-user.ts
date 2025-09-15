import { sql } from "drizzle-orm";
import { adminDB } from "../src/client";

const rlsUser = process.env.POSTGRES_RLS_USER!;
const rlsPassword = process.env.POSTGRES_RLS_PASSWORD!;

export async function createRlsUser() {
  try {
    const res = await adminDB.execute(sql`
    CREATE USER ${sql.raw(rlsUser)}
    WITH
      LOGIN PASSWORD ${sql.raw(`'${rlsPassword}'`)};

    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${sql.raw(rlsUser)};
    `);

    console.log("RLS user created:", res);
  } catch (error: any) {
    if (error.code === "42710") {
      // User already exists, just grant privileges
      console.log("RLS user already exists, granting privileges...");
      return await adminDB.execute(sql`
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${sql.raw(rlsUser)};
      `);
    }
    throw error;
  }
}
