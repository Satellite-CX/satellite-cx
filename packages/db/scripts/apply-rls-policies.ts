import path from "path";
import { adminDB } from "../src/client";
import { sql } from "drizzle-orm";

if (process.env.DISABLE_RLS === "true") {
  console.log("RLS is disabled, skipping...");
  process.exit(0);
}

const sqlPath = path.resolve(__dirname, "..", "sql", "rls-policies.sql");
const file = Bun.file(sqlPath);
const text = await file.text();

await adminDB.execute(sql.raw(text));
process.exit(0);
