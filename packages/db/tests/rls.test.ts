import { faker } from "@faker-js/faker";
import { env } from "@repo/validators";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq, ne } from "drizzle-orm";
import { reset, seed } from "drizzle-seed";
import { createDrizzleClient } from "../src";
import { adminDB } from "../src/client";
import * as schema from "../src/schema";
import { Tenant, tenants, User, users } from "../src/schema";

describe("RLS Policies", () => {
  let tenant: Tenant;
  let agent: User;
  let admin: User;

  beforeAll(async () => {
    await seed(adminDB, schema).refine((f) => ({
      tenants: {
        count: 20,
        with: {
          users: 10,
        },
      },
    }));
    const allTenants = await adminDB.query.tenants.findMany();
    expect(allTenants.length).toBeGreaterThan(0);
    tenant = faker.helpers.arrayElement(allTenants);
    expect(tenant).toBeDefined();
    const userResult = await adminDB.query.users.findFirst({
      where: and(eq(users.tenantId, tenant.id), eq(users.role, "agent")),
    });
    agent = userResult!;
    expect(agent).toBeDefined();
    const adminUserResult = await adminDB.query.users.findFirst({
      where: and(eq(users.tenantId, tenant.id), eq(users.role, "admin")),
    });
    admin = adminUserResult!;
    expect(admin).toBeDefined();
  });

  afterAll(async () => {
    await reset(adminDB, schema);
  });

  test("RLS Should be enabled", async () => {
    expect(env.ENABLE_RLS).toBe(true);
  });

  describe("Viewing tenants", () => {
    test("Everyone can only view their own tenant", async () => {
      const { rls } = await createDrizzleClient(tenant.id, agent.role);
      const tenantsQuery = await rls((tx) => tx.query.tenants.findMany());
      expect(tenantsQuery).toHaveLength(1);
    });

    test("Anyone cannot retrieve another tenant's data", async () => {
      const otherTenant = await adminDB.query.tenants.findFirst({
        where: ne(tenants.id, tenant.id),
      });
      expect(otherTenant).toBeDefined();
      const { rls } = await createDrizzleClient(tenant.id, agent.role);
      const tenantQuery = await rls((tx) =>
        tx.query.tenants.findFirst({
          where: eq(tenants.id, otherTenant!.id),
        })
      );
      expect(tenantQuery).toBeUndefined();
    });
  });

  describe("Creating tenants", () => {
    test("Nobody can create a tenant", async () => {
      const { rls } = await createDrizzleClient(tenant.id, admin.role);
      expect(
        rls((tx) =>
          tx
            .insert(tenants)
            .values({
              name: "New Tenant",
              slug: "new-tenant",
              domain: "new-tenant.com",
            })
            .returning()
            .then((res) => res[0])
        )
      ).rejects.toThrow(
        'new row violates row-level security policy for table "tenants"'
      );
    });
  });

  describe("Editing tenants", () => {
    test("Admins can edit their own tenant", async () => {
      const { rls } = await createDrizzleClient(tenant.id, admin.role);
      const result = await rls((tx) =>
        tx
          .update(tenants)
          .set({ name: "Updated Name" })
          .where(eq(tenants.id, tenant.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result).toBeDefined();
      expect(result?.name).toBe("Updated Name");
    });

    test("Admins cannot edit another tenant", async () => {
      const otherTenant = await adminDB.query.tenants.findFirst({
        where: ne(tenants.id, tenant.id),
      });
      expect(otherTenant).toBeDefined();
      const { rls } = await createDrizzleClient(tenant.id, admin.role);
      const newName = faker.lorem.word();
      const result = await rls((tx) =>
        tx
          .update(tenants)
          .set({ name: newName })
          .where(eq(tenants.id, otherTenant!.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result?.name).not.toBe(newName);
    });

    test("Non-admins cannot edit their own tenant", async () => {
      const { rls } = await createDrizzleClient(tenant.id, agent.role);
      const newName = faker.lorem.word();
      const result = await rls((tx) =>
        tx
          .update(tenants)
          .set({ name: newName })
          .where(eq(tenants.id, tenant.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result?.name).not.toBe(newName);
    });

    test("Non-admins cannot edit another tenant", async () => {
      const otherTenant = await adminDB.query.tenants.findFirst({
        where: ne(tenants.id, tenant.id),
      });
      expect(otherTenant).toBeDefined();
      const { rls } = await createDrizzleClient(tenant.id, agent.role);
      const newName = faker.lorem.word();
      const result = await rls((tx) =>
        tx
          .update(tenants)
          .set({ name: newName })
          .where(eq(tenants.id, otherTenant!.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result?.name).not.toBe(newName);
    });
  });

  describe("Deleting tenants", () => {
    test("Admins can delete their own tenant", async () => {
      const { rls } = await createDrizzleClient(tenant.id, admin.role);
      const result = await rls((tx) =>
        tx
          .delete(tenants)
          .where(eq(tenants.id, tenant.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result).toBeDefined();
    });

    test("Admins cannot delete another tenant", async () => {
      const otherTenant = await adminDB.query.tenants.findFirst({
        where: ne(tenants.id, tenant.id),
      });
      expect(otherTenant).toBeDefined();
      const { rls } = await createDrizzleClient(tenant.id, admin.role);
      const result = await rls((tx) =>
        tx
          .delete(tenants)
          .where(eq(tenants.id, otherTenant!.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result).toBeUndefined();
    });

    test("Non-admins cannot delete their own tenant", async () => {
      const { rls } = await createDrizzleClient(tenant.id, agent.role);
      const result = await rls((tx) =>
        tx
          .delete(tenants)
          .where(eq(tenants.id, tenant.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result).toBeUndefined();
    });

    test("Non-admins cannot delete another tenant", async () => {
      const otherTenant = await adminDB.query.tenants.findFirst({
        where: ne(tenants.id, tenant.id),
      });
      expect(otherTenant).toBeDefined();
      const { rls } = await createDrizzleClient(tenant.id, agent.role);
      const result = await rls((tx) =>
        tx
          .delete(tenants)
          .where(eq(tenants.id, otherTenant!.id))
          .returning()
          .then((res) => res[0])
      );
      expect(result).toBeUndefined();
    });
  });
});
