import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { reset, seed } from "drizzle-seed";
import { createRlsUser } from "../scripts/create-rls-user";
import { createDrizzleClient } from "../src";
import { adminDB } from "../src/client";
import * as schema from "../src/schema";
import { Tenant, users } from "../src/schema";

let tenant: Tenant;

beforeAll(async () => {
  await createRlsUser();
  await seed(adminDB, schema);
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
  await reset(adminDB, schema);
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
