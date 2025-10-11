import { adminDB } from "@repo/db/client";
import { customers, organizations } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createTrpcCaller } from "../src";

describe("Customer Mutations", () => {
  let testData: Awaited<ReturnType<typeof generateTestData>>;
  let caller: ReturnType<typeof createTrpcCaller>;

  beforeAll(async () => {
    testData = await generateTestData();
    await seedDatabase(testData);

    const headers = new Headers({
      "x-api-key": testData.apiKey.key,
    });

    caller = createTrpcCaller({ headers });
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("Create customer", () => {
    it("should successfully create a new customer", async () => {
      const customerData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
      };

      const result = await caller.customers.create(customerData);

      expect(result).toBeDefined();
      expect(result.name).toBe(customerData.name);
      expect(result.email).toBe(customerData.email);
      expect(result.phone).toBe(customerData.phone);
      expect(result.organizationId).toBe(testData.organization.id);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should validate required fields", async () => {
      expect(
        // @ts-expect-error - missing required fields
        caller.customers.create({})
      ).rejects.toThrow();

      expect(
        // @ts-expect-error - missing email and phone
        caller.customers.create({ name: "John Doe" })
      ).rejects.toThrow();
    });
  });

  describe("Get customer by ID", () => {
    it("should successfully retrieve an existing customer", async () => {
      const customers = await caller.customers.list();
      const customer = customers[0]!;

      const result = await caller.customers.get({ id: customer.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(customer.id);
      expect(result.name).toBe(customer.name);
      expect(result.email).toBe(customer.email);
    });

    it("should throw NOT_FOUND error for non-existent customer", async () => {
      expect(
        caller.customers.get({ id: "non-existent-customer-id" })
      ).rejects.toThrow("Customer not found");
    });

    it("should enforce organization isolation", async () => {
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "get-test-other-org",
          name: "Get Test Other Org",
          slug: "get-test-other-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgCustomer] = await adminDB
        .insert(customers)
        .values({
          id: "other-org-get-customer",
          organizationId: otherOrg!.id,
          name: "Other Org Customer",
          email: "other@example.com",
          phone: "+1234567890",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(
        caller.customers.get({ id: otherOrgCustomer!.id })
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("List customers", () => {
    it("should return list of customers for organization", async () => {
      const result = await caller.customers.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      for (const customer of result) {
        expect(customer.organizationId).toBe(testData.organization.id);
        expect(customer.id).toBeDefined();
        expect(customer.name).toBeDefined();
        expect(customer.email).toBeDefined();
      }
    });

    it("should support pagination", async () => {
      const page1 = await caller.customers.list({ limit: 2, offset: 0 });
      const page2 = await caller.customers.list({ limit: 2, offset: 2 });

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);

      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0]!.id).not.toBe(page2[0]!.id);
      }
    });

    it("should support ordering", async () => {
      const ascResult = await caller.customers.list({
        orderBy: { field: "name", direction: "asc" }
      });
      const descResult = await caller.customers.list({
        orderBy: { field: "name", direction: "desc" }
      });

      if (ascResult.length > 1) {
        expect(ascResult[0]!.name <= ascResult[1]!.name).toBe(true);
      }
      if (descResult.length > 1) {
        expect(descResult[0]!.name >= descResult[1]!.name).toBe(true);
      }
    });
  });

  describe("Update customer", () => {
    it("should successfully update an existing customer", async () => {
      const customers = await caller.customers.list();
      const customer = customers[0]!;

      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const result = await caller.customers.update({
        id: customer.id,
        ...updateData,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(customer.id);
      expect(result.name).toBe(updateData.name);
      expect(result.email).toBe(updateData.email);
      expect(result.phone).toBe(customer.phone); // unchanged
      expect(new Date(result.updatedAt) > new Date(customer.updatedAt)).toBe(true);
    });

    it("should throw NOT_FOUND error for non-existent customer", async () => {
      expect(
        caller.customers.update({
          id: "non-existent-customer-id",
          name: "Updated Name",
        })
      ).rejects.toThrow("Customer not found");
    });

    it("should enforce organization isolation", async () => {
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "update-test-other-org",
          name: "Update Test Other Org",
          slug: "update-test-other-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgCustomer] = await adminDB
        .insert(customers)
        .values({
          id: "other-org-update-customer",
          organizationId: otherOrg!.id,
          name: "Other Org Customer",
          email: "other@example.com",
          phone: "+1234567890",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(
        caller.customers.update({
          id: otherOrgCustomer!.id,
          name: "Updated Name",
        })
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("Delete customer by ID", () => {
    it("should successfully delete an existing customer", async () => {
      // Create a customer specifically for deletion testing
      const customerToDelete = await caller.customers.create({
        name: "Delete Test Customer",
        email: "delete@example.com",
        phone: "+1234567890",
      });

      const result = await caller.customers.delete({ id: customerToDelete.id });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe("Customer deleted successfully");

      // Verify customer is actually deleted
      expect(
        caller.customers.get({ id: customerToDelete.id })
      ).rejects.toThrow("Customer not found");
    });

    it("should throw NOT_FOUND error for non-existent customer", async () => {
      expect(
        caller.customers.delete({ id: "non-existent-customer-id" })
      ).rejects.toThrow("Customer not found");
    });

    it("should enforce organization isolation", async () => {
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "delete-test-other-org",
          name: "Delete Test Other Org",
          slug: "delete-test-other-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgCustomer] = await adminDB
        .insert(customers)
        .values({
          id: "other-org-delete-customer",
          organizationId: otherOrg!.id,
          name: "Other Org Customer",
          email: "other@example.com",
          phone: "+1234567890",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(
        caller.customers.delete({ id: otherOrgCustomer!.id })
      ).rejects.toThrow("Customer not found");
    });

    it("should validate input parameter", async () => {
      expect(
        // @ts-expect-error - missing required id parameter
        caller.customers.delete({})
      ).rejects.toThrow();

      expect(
        // @ts-expect-error - id should be string
        caller.customers.delete({ id: 123 })
      ).rejects.toThrow();
    });

    it("should return correct response schema", async () => {
      // Create a customer specifically for testing response schema
      const customerToDelete = await caller.customers.create({
        name: "Schema Test Customer",
        email: "schema@example.com",
        phone: "+1234567890",
      });

      const result = await caller.customers.delete({
        id: customerToDelete.id,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
      expect(result.success).toBe(true);
    });
  });
});