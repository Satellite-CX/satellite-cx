import { faker } from "@faker-js/faker";
import { adminDB } from "./client";
import { tenants, users } from "./schema";

export async function seed() {
  // Create test tenants
  const tenant1 = await adminDB
    .insert(tenants)
    .values({
      name: "Test Tenant 1",
      slug: "test-tenant-1",
      domain: "test1.example.com",
    })
    .returning();

  const tenant2 = await adminDB
    .insert(tenants)
    .values({
      name: "Test Tenant 2",
      slug: "test-tenant-2",
      domain: "test2.example.com",
    })
    .returning();

  // Create test users for each tenant
  await adminDB.insert(users).values([
    {
      tenantId: tenant1[0].id,
      email: "user1@test1.example.com",
      password: "hashedpassword1",
      role: "admin",
    },
    {
      tenantId: tenant1[0].id,
      email: "user2@test1.example.com",
      password: "hashedpassword2",
      role: "user",
    },
    {
      tenantId: tenant2[0].id,
      email: "user1@test2.example.com",
      password: "hashedpassword3",
      role: "admin",
    },
    {
      tenantId: tenant2[0].id,
      email: "user2@test2.example.com",
      password: "hashedpassword4",
      role: "user",
    },
  ]);
}
