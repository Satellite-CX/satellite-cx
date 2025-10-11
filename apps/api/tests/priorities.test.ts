import { adminDB } from "@repo/db/client";
import { organizations, Priority, priorities } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { app } from "../src";

describe("Priorities", () => {
  let headers: Record<string, string>;

  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    testData = await generateTestData();
    await seedDatabase(testData);

    headers = {
      "x-api-key": testData.apiKey.key,
    };
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("GET /priorities", () => {
    it("should return a list of priorities", async () => {
      const response = await app.request("/priorities", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(4); // Based on seed data
      expect(
        data.every(
          (priority: Priority) => priority.organizationId === testData.organization.id
        )
      ).toBe(true);
    });

    it("should return priorities ordered by name alphabetically", async () => {
      const response = await app.request("/priorities", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      // Based on seed data: ["Low", "Medium", "High", "Urgent"]
      // Alphabetically: ["High", "Low", "Medium", "Urgent"]
      expect(data[0].name).toBe("High");
      expect(data[1].name).toBe("Low");
      expect(data[2].name).toBe("Medium");
      expect(data[3].name).toBe("Urgent");
    });

    it("should enforce organization isolation", async () => {
      // Create another organization with its own priorities
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "api-test-other-org",
          name: "API Test Other Org",
          slug: "api-test-other-org",
          createdAt: new Date(),
        })
        .returning();

      await adminDB.insert(priorities).values([
        {
          id: "other-org-priority-1",
          organizationId: otherOrg!.id,
          name: "Other Org Priority 1",
          icon: "🟦",
          color: "cyan",
          createdAt: new Date(),
        },
        {
          id: "other-org-priority-2",
          organizationId: otherOrg!.id,
          name: "Other Org Priority 2",
          icon: "🟪",
          color: "magenta",
          createdAt: new Date(),
        },
      ]);

      const response = await app.request("/priorities", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      // Should still return only 4 priorities from the test organization
      expect(data).toHaveLength(4);

      // Verify all returned priorities belong to the test organization
      data.forEach((priority: Priority) => {
        expect(priority.organizationId).toBe(testData.organization.id);
      });
    });

    it("should require authentication", async () => {
      const response = await app.request("/priorities");
      expect(response.status).toBe(401);
    });

    it("should return priorities with correct schema structure", async () => {
      const response = await app.request("/priorities", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      const priority = data[0];
      expect(priority).toHaveProperty("id");
      expect(priority).toHaveProperty("organizationId");
      expect(priority).toHaveProperty("name");
      expect(priority).toHaveProperty("icon");
      expect(priority).toHaveProperty("color");
      expect(priority).toHaveProperty("createdAt");
      expect(priority).toHaveProperty("updatedAt");

      expect(typeof priority.id).toBe("string");
      expect(typeof priority.organizationId).toBe("string");
      expect(typeof priority.name).toBe("string");
      expect(priority.organizationId).toBe(testData.organization.id);
    });

    it("should return valid priority data from seed", async () => {
      const response = await app.request("/priorities", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      // Check that we have the expected priority names from seed data
      const priorityNames = data.map((p: Priority) => p.name).sort();
      expect(priorityNames).toEqual(["High", "Low", "Medium", "Urgent"]);

      // Check that each priority has the expected properties
      data.forEach((priority: Priority) => {
        expect(priority.id).toMatch(/^priority-/);
        expect(["🟢", "🟡", "🟠", "🔴"]).toContain(priority.icon!);
        expect(["green", "yellow", "orange", "red"]).toContain(priority.color!);
      });
    });

    describe("Query params", () => {
      test("limit", async () => {
        const params = new URLSearchParams({ limit: "2" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(2);
      });

      test("offset", async () => {
        const params = new URLSearchParams({ offset: "2" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(2);
      });

      test("limit and offset combined", async () => {
        const params = new URLSearchParams({ limit: "2", offset: "1" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(2);
      });

      test("limit exceeding total count", async () => {
        const params = new URLSearchParams({ limit: "100" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(4);
      });

      test("offset exceeding total count", async () => {
        const params = new URLSearchParams({ offset: "100" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(0);
      });

      test("limit of 0 should be rejected", async () => {
        const params = new URLSearchParams({ limit: "0" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("invalid limit parameter", async () => {
        const params = new URLSearchParams({ limit: "invalid" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("invalid offset parameter", async () => {
        const params = new URLSearchParams({ offset: "invalid" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("negative limit", async () => {
        const params = new URLSearchParams({ limit: "-1" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("negative offset", async () => {
        const params = new URLSearchParams({ offset: "-1" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("limit over maximum allowed", async () => {
        const params = new URLSearchParams({ limit: "101" });
        const response = await app.request(`/priorities?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });
    });

    describe("Content-Type and Response Format", () => {
      it("should return JSON content type", async () => {
        const response = await app.request("/priorities", {
          headers,
        });
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain(
          "application/json"
        );
      });

      it("should return valid JSON", async () => {
        const response = await app.request("/priorities", {
          headers,
        });
        expect(response.status).toBe(200);

        // Should not throw when parsing JSON
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });
    });

    describe("Edge cases", () => {
      it("should handle empty query string gracefully", async () => {
        const response = await app.request("/priorities?", {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(4);
      });

      it("should reject malformed query parameters", async () => {
        const response = await app.request("/priorities?limit=&offset=", {
          headers,
        });
        expect(response.status).toBe(400);
      });

      it("should reject duplicate query parameters", async () => {
        const response = await app.request("/priorities?limit=2&limit=3", {
          headers,
        });
        expect(response.status).toBe(400);
      });
    });
  });

  describe("POST /priorities", () => {
    it("should create a priority with all fields", async () => {
      const priorityData = {
        name: "Urgent",
        icon: "🚨",
        color: "#ef4444",
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.name).toBe(priorityData.name);
      expect(data.icon).toBe(priorityData.icon);
      expect(data.color).toBe(priorityData.color);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(typeof data.id).toBe("string");
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it("should create a priority with only required fields", async () => {
      const priorityData = {
        name: "Minimal Priority",
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.name).toBe(priorityData.name);
      expect(data.icon).toBeNull();
      expect(data.color).toBeNull();
      expect(data.organizationId).toBe(testData.organization.id);
    });

    it("should reject empty name", async () => {
      const priorityData = {
        name: "",
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(400);
    });

    it("should reject name that's too long", async () => {
      const priorityData = {
        name: "x".repeat(101),
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(400);
    });

    it("should reject missing name", async () => {
      const priorityData = {
        icon: "🔄",
        color: "#fbbf24",
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(400);
    });

    it("should require authentication", async () => {
      const priorityData = {
        name: "Test Priority",
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(401);
    });

    it("should require valid JSON", async () => {
      const response = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(response.status).toBe(500); // Hono returns 500 for malformed JSON
    });

    it("should require Content-Type header", async () => {
      const priorityData = {
        name: "Test Priority",
      };

      const response = await app.request("/priorities", {
        method: "POST",
        headers,
        body: JSON.stringify(priorityData),
      });

      expect(response.status).toBe(500); // Hono returns 500 for missing Content-Type when parsing JSON
    });
  });

  describe("GET /priorities/{id}", () => {
    it("should return a priority by ID", async () => {
      // First get the list to find a valid priority ID
      const listResponse = await app.request("/priorities", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const priorities = await listResponse.json();
      const firstPriority = priorities[0];

      const response = await app.request(`/priorities/${firstPriority.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(firstPriority.id);
      expect(data.name).toBe(firstPriority.name);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");
    });

    it("should return 404 for non-existent priority", async () => {
      const response = await app.request("/priorities/non-existent-priority", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await app.request("/priorities/priority-low");

      expect(response.status).toBe(401);
    });

    it("should enforce organization isolation", async () => {
      // Try to access a priority from another organization
      const response = await app.request("/priorities/other-org-priority-1", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should return JSON content type", async () => {
      const response = await app.request("/priorities/priority-low", {
        headers,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return priority with correct schema structure", async () => {
      // Get a valid priority ID first
      const listResponse = await app.request("/priorities", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const priorities = await listResponse.json();
      const testPriority = priorities[1] || priorities[0]; // Use second priority if available

      const response = await app.request(`/priorities/${testPriority.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("organizationId");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("icon");
      expect(data).toHaveProperty("color");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");

      expect(typeof data.id).toBe("string");
      expect(typeof data.organizationId).toBe("string");
      expect(typeof data.name).toBe("string");
      expect(data.organizationId).toBe(testData.organization.id);
    });
  });

  describe("PATCH /priorities/{id}", () => {
    it("should update a priority with all fields", async () => {
      // Get a priority to update
      const listResponse = await app.request("/priorities", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const priorities = await listResponse.json();
      const priorityToUpdate = priorities[0];

      const updateData = {
        name: "Updated Priority",
        icon: "🔄",
        color: "#ff6b6b",
      };

      const response = await app.request(`/priorities/${priorityToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(priorityToUpdate.id);
      expect(data.name).toBe(updateData.name);
      expect(data.icon).toBe(updateData.icon);
      expect(data.color).toBe(updateData.color);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");
    });

    it("should update a priority with partial fields", async () => {
      // Get a different priority to update
      const listResponse = await app.request("/priorities", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const priorities = await listResponse.json();
      const priorityToUpdate = priorities[1] || priorities[0];
      const originalIcon = priorityToUpdate.icon;
      const originalColor = priorityToUpdate.color;

      const updateData = {
        name: "Partially Updated Priority",
      };

      const response = await app.request(`/priorities/${priorityToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(priorityToUpdate.id);
      expect(data.name).toBe(updateData.name);
      expect(data.icon).toBe(originalIcon); // Should remain unchanged
      expect(data.color).toBe(originalColor); // Should remain unchanged
      expect(data.organizationId).toBe(testData.organization.id);
    });

    it("should return 404 for non-existent priority", async () => {
      const updateData = {
        name: "Updated Priority",
      };

      const response = await app.request("/priorities/non-existent-priority", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const updateData = {
        name: "Updated Priority",
      };

      const response = await app.request("/priorities/priority-low", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(401);
    });

    it("should enforce organization isolation", async () => {
      const updateData = {
        name: "Updated Priority",
      };

      const response = await app.request("/priorities/other-org-priority-1", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404);
    });

    it("should reject empty name", async () => {
      const listResponse = await app.request("/priorities", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const priorities = await listResponse.json();
      const priorityToUpdate = priorities[0];

      const updateData = {
        name: "",
      };

      const response = await app.request(`/priorities/${priorityToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(400);
    });

    it("should reject name that's too long", async () => {
      const listResponse = await app.request("/priorities", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const priorities = await listResponse.json();
      const priorityToUpdate = priorities[0];

      const updateData = {
        name: "x".repeat(101),
      };

      const response = await app.request(`/priorities/${priorityToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /priorities/{id}", () => {
    it("should delete a priority by ID", async () => {
      // Create a priority to delete
      const createResponse = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Priority to Delete",
          icon: "🗑️",
          color: "#ef4444",
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdPriority = await createResponse.json();

      const response = await app.request(`/priorities/${createdPriority.id}`, {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify the priority is no longer accessible
      const getResponse = await app.request(`/priorities/${createdPriority.id}`, {
        headers,
      });
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 for non-existent priority", async () => {
      const response = await app.request("/priorities/non-existent-priority", {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await app.request("/priorities/priority-low", {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("should enforce organization isolation", async () => {
      const response = await app.request("/priorities/other-org-priority-1", {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should return correct response schema", async () => {
      // Create a priority to delete
      const createResponse = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Priority for Schema Test",
          icon: "📋",
          color: "#3b82f6",
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdPriority = await createResponse.json();

      const response = await app.request(`/priorities/${createdPriority.id}`, {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("success");
      expect(typeof data.success).toBe("boolean");
      expect(data.success).toBe(true);
    });

    it("should return JSON content type", async () => {
      // Create a priority to delete
      const createResponse = await app.request("/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Priority for Content Type Test",
          icon: "📄",
          color: "#10b981",
        }),
      });
      expect(createResponse.status).toBe(201);
      const createdPriority = await createResponse.json();

      const response = await app.request(`/priorities/${createdPriority.id}`, {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });
});