import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createDrizzleClient } from "../src";
import { adminDB } from "../src/client";
import * as schema from "../src/schema";
import { Tenant, users, tenants } from "../src/schema";
import { seed } from "../src/seed";

let tenant: Tenant;

beforeAll(async () => {
  await seed();
  const allTenants = await adminDB.query.tenants.findMany({
    with: {
      users: true,
    },
  });
  expect(allTenants.length).toBeGreaterThan(0);
  tenant = faker.helpers.arrayElement(allTenants);
  expect(tenant).toBeDefined();
});

afterAll(async () => {
  console.log("Cleaning up database...");
  await adminDB.delete(users);
  await adminDB.delete(tenants);
});

test("DB Should be seeded", async () => {
  const allTenants = await adminDB.query.tenants.findMany();
  expect(allTenants.length).toBeGreaterThan(0);
});

test("Users can only view their own tenants", async () => {
  const queryUser = await adminDB.query.users.findFirst({
    where: eq(users.tenantId, tenant.id),
  });
  expect(queryUser).toBeDefined();
  const client = await createDrizzleClient(tenant.id, queryUser!.role);
  const tenantsQuery = await client.rls((tx) => tx.query.tenants.findMany());
  expect(tenantsQuery).toHaveLength(1);
});
