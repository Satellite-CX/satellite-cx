import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { reset, seed } from "drizzle-seed";
import { nanoid } from "nanoid";
import { createDrizzleClient } from "../src";
import { adminDB } from "../src/client";
import * as schema from "../src/schema";

describe("RLS Policies", () => {
  beforeAll(async () => {
    await seed(adminDB, schema);
  });

  afterAll(async () => {
    await reset(adminDB, schema);
  });

  describe("Organization isolation", () => {
    test("Users should only see organizations they belong to", async () => {
      const user = await adminDB
        .insert(schema.users)
        .values({
          id: nanoid(),
          name: "Test User",
          email: "test@example.com",
          emailVerified: true,
        })
        .returning()
        .then((rows) => rows[0]!);

      const organization = await adminDB
        .insert(schema.organizations)
        .values({
          id: nanoid(),
          name: "Test Organization",
          slug: "test-organization",
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      await adminDB.insert(schema.members).values({
        id: nanoid(),
        userId: user.id,
        organizationId: organization.id,
        role: "member",
        createdAt: new Date(),
      });

      const { rls } = await createDrizzleClient(
        organization.id,
        "member",
        user.id
      );

      const result = await rls((tx) => tx.query.organizations.findMany());

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(organization.id);
    });

    test("Users should only see members from their organization", async () => {
      const user1 = await adminDB
        .insert(schema.users)
        .values({
          id: nanoid(),
          name: "User 1",
          email: `user1-${nanoid()}@example.com`,
          emailVerified: true,
        })
        .returning()
        .then((rows) => rows[0]!);

      const user2 = await adminDB
        .insert(schema.users)
        .values({
          id: nanoid(),
          name: "User 2",
          email: `user2-${nanoid()}@example.com`,
          emailVerified: true,
        })
        .returning()
        .then((rows) => rows[0]!);

      const organization = await adminDB
        .insert(schema.organizations)
        .values({
          id: nanoid(),
          name: "Test Organization",
          slug: `test-organization-${nanoid()}`,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      await adminDB.insert(schema.members).values({
        id: nanoid(),
        userId: user1.id,
        organizationId: organization.id,
        role: "member",
        createdAt: new Date(),
      });

      await adminDB.insert(schema.members).values({
        id: nanoid(),
        userId: user2.id,
        organizationId: organization.id,
        role: "admin",
        createdAt: new Date(),
      });

      const { rls } = await createDrizzleClient(
        organization.id,
        "member",
        user1.id
      );

      const result = await rls((tx) => tx.query.members.findMany());

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.userId)).toContain(user1.id);
      expect(result.map((m) => m.userId)).toContain(user2.id);
    });

    test("Users should only see teams from their organization", async () => {
      const user = await adminDB
        .insert(schema.users)
        .values({
          id: nanoid(),
          name: "Test User",
          email: `test-${nanoid()}@example.com`,
          emailVerified: true,
        })
        .returning()
        .then((rows) => rows[0]!);

      const organization = await adminDB
        .insert(schema.organizations)
        .values({
          id: nanoid(),
          name: "Test Organization",
          slug: `test-organization-${nanoid()}`,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      await adminDB.insert(schema.members).values({
        id: nanoid(),
        userId: user.id,
        organizationId: organization.id,
        role: "member",
        createdAt: new Date(),
      });

      const team = await adminDB
        .insert(schema.teams)
        .values({
          id: nanoid(),
          name: "Test Team",
          organizationId: organization.id,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      const { rls } = await createDrizzleClient(
        organization.id,
        "member",
        user.id
      );

      const result = await rls((tx) => tx.query.teams.findMany());

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(team.id);
    });

    test("Users should only see customers from their organization", async () => {
      const user = await adminDB
        .insert(schema.users)
        .values({
          id: nanoid(),
          name: "Test User",
          email: `test-customer-${nanoid()}@example.com`,
          emailVerified: true,
        })
        .returning()
        .then((rows) => rows[0]!);

      const organization = await adminDB
        .insert(schema.organizations)
        .values({
          id: nanoid(),
          name: "Test Organization",
          slug: `test-organization-customer-${nanoid()}`,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      await adminDB.insert(schema.members).values({
        id: nanoid(),
        userId: user.id,
        organizationId: organization.id,
        role: "member",
        createdAt: new Date(),
      });

      const customer = await adminDB
        .insert(schema.customers)
        .values({
          id: nanoid(),
          name: "Test Customer",
          email: "customer@example.com",
          phone: "123-456-7890",
          organizationId: organization.id,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      const { rls } = await createDrizzleClient(
        organization.id,
        "member",
        user.id
      );

      const result = await rls((tx) => tx.query.customers.findMany());

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(customer.id);
    });

    test("Users should only see tickets from their organization", async () => {
      const user = await adminDB
        .insert(schema.users)
        .values({
          id: nanoid(),
          name: "Test User",
          email: `test-${nanoid()}@example.com`,
          emailVerified: true,
        })
        .returning()
        .then((rows) => rows[0]!);

      const organization = await adminDB
        .insert(schema.organizations)
        .values({
          id: nanoid(),
          name: "Test Organization",
          slug: `test-organization-${nanoid()}`,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      await adminDB.insert(schema.members).values({
        id: nanoid(),
        userId: user.id,
        organizationId: organization.id,
        role: "member",
        createdAt: new Date(),
      });

      const customer = await adminDB
        .insert(schema.customers)
        .values({
          id: nanoid(),
          name: "Test Customer",
          email: "customer@example.com",
          phone: "123-456-7890",
          organizationId: organization.id,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      const ticket = await adminDB
        .insert(schema.tickets)
        .values({
          id: nanoid(),
          subject: "Test Ticket",
          description: "Test Description",
          customerId: customer.id,
          organizationId: organization.id,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]!);

      const { rls } = await createDrizzleClient(
        organization.id,
        "member",
        user.id
      );

      const result = await rls((tx) => tx.query.tickets.findMany());

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(ticket.id);
    });
  });
});
