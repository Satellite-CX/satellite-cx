import { and, eq } from "drizzle-orm";
import { seed } from "drizzle-seed";
import { adminDB } from "../src/client";
import * as schema from "../src/schema";
import { users } from "../src/schema";

export async function seedDatabase() {
  await seed(adminDB, schema).refine(() => ({
    tenants: {
      count: 20,
      with: {
        users: 10,
      },
    },
  }));

  // Get the first tenant from the seeded data
  const tenantCreated = await adminDB.query.tenants.findFirst();

  if (!tenantCreated) {
    throw new Error("No tenant found after seeding");
  }

  // Get existing users from the seeded data
  const adminUser = await adminDB.query.users.findFirst({
    where: and(eq(users.role, "admin"), eq(users.tenantId, tenantCreated.id)),
  });

  const agentUser = await adminDB.query.users.findFirst({
    where: and(eq(users.role, "agent"), eq(users.tenantId, tenantCreated.id)),
  });

  if (!adminUser || !agentUser) {
    throw new Error("Failed to find admin user or agent user in seeded data");
  }

  return {
    tenant: tenantCreated,
    adminUser,
    agentUser,
  };
}
