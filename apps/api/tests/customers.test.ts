import { customers } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { app } from "../src";

type Customer = typeof customers.$inferSelect;

describe("Customers", () => {
  let headers: Record<string, string>;
  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    testData = await generateTestData();

    await seedDatabase({
      testData,
      customerCount: 12,
    });

    headers = {
      "x-api-key": testData.apiKey.key,
    };
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("GET /customers", () => {
    it("should return a list of customers", async () => {
      const response = await app.request("/customers", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(12);
      expect(
        data.every(
          (customer: Customer) =>
            customer.organizationId === testData.organization.id
        )
      ).toBe(true);
    });

    describe("Query params", () => {
      test("limit", async () => {
        const params = new URLSearchParams({ limit: "5" });
        const response = await app.request(`/customers?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(5);
      });

      test("offset", async () => {
        const params = new URLSearchParams({ offset: "5" });
        const response = await app.request(`/customers?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(7);
      });

      test("orderBy ascending", async () => {
        const params = new URLSearchParams({
          orderBy: JSON.stringify({ field: "name", direction: "asc" }),
        });
        const response = await app.request(`/customers?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        const names = data.map((customer: Customer) => customer.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      });

      test("orderBy descending", async () => {
        const params = new URLSearchParams({
          orderBy: JSON.stringify({ field: "name", direction: "desc" }),
        });
        const response = await app.request(`/customers?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        const names = data.map((customer: Customer) => customer.name);
        const sortedNames = [...names].sort().reverse();
        expect(names).toEqual(sortedNames);
      });
    });
  });

  describe("GET /customers/{id}", () => {
    it("should return a single customer by ID", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const firstCustomer = customers[0];

      const response = await app.request(`/customers/${firstCustomer.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(firstCustomer.id);
      expect(data.name).toBe(firstCustomer.name);
      expect(data.email).toBe(firstCustomer.email);
      expect(data.organizationId).toBe(testData.organization.id);
    });

    it("should return 404 for non-existent customer", async () => {
      const response = await app.request("/customers/non-existent-id", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should enforce organization isolation", async () => {
      const response = await app.request("/customers/other-org-customer-id", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const firstCustomer = customers[0];

      const response = await app.request(`/customers/${firstCustomer.id}`);

      expect(response.status).toBe(401);
    });

    it("should return customer with correct schema structure", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const firstCustomer = customers[0];

      const response = await app.request(`/customers/${firstCustomer.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("organizationId");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("phone");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");

      expect(typeof data.id).toBe("string");
      expect(typeof data.name).toBe("string");
      expect(typeof data.email).toBe("string");
      expect(typeof data.phone).toBe("string");
    });
  });

  describe("POST /customers", () => {
    it("should successfully create a new customer", async () => {
      const customerData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
      };

      const response = await app.request("/customers", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe(customerData.name);
      expect(data.email).toBe(customerData.email);
      expect(data.phone).toBe(customerData.phone);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(data.id).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it("should return 400 for invalid request data", async () => {
      const response = await app.request("/customers", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should require authentication", async () => {
      const customerData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
      };

      const response = await app.request("/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await app.request("/customers", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "John Doe" }), // Missing email and phone
      });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /customers/{id}", () => {
    it("should successfully update an existing customer", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const customer = customers[0];

      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const response = await app.request(`/customers/${customer.id}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(customer.id);
      expect(data.name).toBe(updateData.name);
      expect(data.email).toBe(updateData.email);
      expect(data.phone).toBe(customer.phone); // unchanged
      expect(new Date(data.updatedAt) > new Date(customer.updatedAt)).toBe(
        true
      );
    });

    it("should return 404 for non-existent customer", async () => {
      const response = await app.request("/customers/non-existent-id", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const customer = customers[0];

      const response = await app.request(`/customers/${customer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      expect(response.status).toBe(401);
    });

    it("should enforce organization isolation", async () => {
      const response = await app.request("/customers/other-org-customer-id", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /customers/{id}", () => {
    it("should successfully delete an existing customer", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const customerToDelete = customers[0];

      const deleteResponse = await app.request(
        `/customers/${customerToDelete.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);
      expect(deleteData.message).toBe("Customer deleted successfully");

      // Verify customer is actually deleted
      const getResponse = await app.request(
        `/customers/${customerToDelete.id}`,
        {
          headers,
        }
      );
      expect(getResponse.status).toBe(404);

      // Verify remaining customers count
      const newListResponse = await app.request("/customers", {
        headers,
      });
      const remainingCustomers = await newListResponse.json();
      expect(remainingCustomers.length).toBe(customers.length - 1);
    });

    it("should return 404 for non-existent customer", async () => {
      const response = await app.request("/customers/non-existent-id", {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should enforce organization isolation", async () => {
      const response = await app.request("/customers/other-org-customer-id", {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const firstCustomer = customers[0];

      const response = await app.request(`/customers/${firstCustomer.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("should return correct response schema", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const customerToDelete = customers[1]; // Use second customer to avoid conflicts

      const deleteResponse = await app.request(
        `/customers/${customerToDelete.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      expect(deleteResponse.status).toBe(200);
      const data = await deleteResponse.json();

      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(typeof data.success).toBe("boolean");
      expect(typeof data.message).toBe("string");
      expect(data.success).toBe(true);
    });

    it("should handle invalid method gracefully", async () => {
      const listResponse = await app.request("/customers", {
        headers,
      });
      const customers = await listResponse.json();
      const firstCustomer = customers[0];

      const response = await app.request(`/customers/${firstCustomer.id}`, {
        method: "PATCH", // Invalid method for this endpoint
        headers,
      });

      expect(response.status).toBe(404);
    });
  });
});
