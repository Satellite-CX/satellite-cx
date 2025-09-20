import { beforeAll, afterAll } from "bun:test";
import { adminDB } from "../src/client";
import { sql } from "drizzle-orm";

// Global test setup and teardown
beforeAll(async () => {
  // Ensure database is clean before running tests
  await adminDB.execute(sql`TRUNCATE TABLE team_members CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE teams CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE invitations CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE members CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE organization_roles CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE sessions CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE organizations CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE users CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE accounts CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE verifications CASCADE`);
});

afterAll(async () => {
  // Clean up after all tests
  await adminDB.execute(sql`TRUNCATE TABLE team_members CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE teams CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE invitations CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE members CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE organization_roles CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE sessions CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE organizations CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE users CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE accounts CASCADE`);
  await adminDB.execute(sql`TRUNCATE TABLE verifications CASCADE`);
});
