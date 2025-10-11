import { adminDB } from "@repo/db/client";
import { organizations, Status, statuses } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { app } from "../src";

describe("Statuses", () => {
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

  describe("GET /statuses", () => {
    it("should return a list of statuses", async () => {
      const response = await app.request("/statuses", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(4); // Based on seed data
      expect(
        data.every(
          (status: Status) => status.organizationId === testData.organization.id
        )
      ).toBe(true);
    });

    it("should return statuses ordered by name alphabetically", async () => {
      const response = await app.request("/statuses", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      // Based on seed data: ["Open", "Pending", "Resolved", "Closed"]
      // Alphabetically: ["Closed", "Open", "Pending", "Resolved"]
      expect(data[0].name).toBe("Closed");
      expect(data[1].name).toBe("Open");
      expect(data[2].name).toBe("Pending");
      expect(data[3].name).toBe("Resolved");
    });

    it("should enforce organization isolation", async () => {
      // Create another organization with its own statuses
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "api-test-other-org",
          name: "API Test Other Org",
          slug: "api-test-other-org",
          createdAt: new Date(),
        })
        .returning();

      await adminDB.insert(statuses).values([
        {
          id: "other-org-status-1",
          organizationId: otherOrg!.id,
          name: "Other Org Status 1",
          icon: "🟦",
          color: "cyan",
          createdAt: new Date(),
        },
        {
          id: "other-org-status-2",
          organizationId: otherOrg!.id,
          name: "Other Org Status 2",
          icon: "🟪",
          color: "magenta",
          createdAt: new Date(),
        },
      ]);

      const response = await app.request("/statuses", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      // Should still return only 4 statuses from the test organization
      expect(data).toHaveLength(4);

      // Verify all returned statuses belong to the test organization
      data.forEach((status: Status) => {
        expect(status.organizationId).toBe(testData.organization.id);
      });
    });

    it("should require authentication", async () => {
      const response = await app.request("/statuses");
      expect(response.status).toBe(401);
    });

    it("should return statuses with correct schema structure", async () => {
      const response = await app.request("/statuses", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      const status = data[0];
      expect(status).toHaveProperty("id");
      expect(status).toHaveProperty("organizationId");
      expect(status).toHaveProperty("name");
      expect(status).toHaveProperty("icon");
      expect(status).toHaveProperty("color");
      expect(status).toHaveProperty("createdAt");
      expect(status).toHaveProperty("updatedAt");

      expect(typeof status.id).toBe("string");
      expect(typeof status.organizationId).toBe("string");
      expect(typeof status.name).toBe("string");
      expect(status.organizationId).toBe(testData.organization.id);
    });

    it("should return valid status data from seed", async () => {
      const response = await app.request("/statuses", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      // Check that we have the expected status names from seed data
      const statusNames = data.map((s: Status) => s.name).sort();
      expect(statusNames).toEqual(["Closed", "Open", "Pending", "Resolved"]);

      // Check that each status has the expected properties
      data.forEach((status: Status) => {
        expect(status.id).toMatch(/^status-/);
        expect(["📋", "⏳", "✅", "🔒"]).toContain(status.icon!);
        expect(["blue", "yellow", "green", "red"]).toContain(status.color!);
      });
    });

    describe("Query params", () => {
      test("limit", async () => {
        const params = new URLSearchParams({ limit: "2" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(2);
      });

      test("offset", async () => {
        const params = new URLSearchParams({ offset: "2" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(2);
      });

      test("limit and offset combined", async () => {
        const params = new URLSearchParams({ limit: "2", offset: "1" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(2);
      });

      test("limit exceeding total count", async () => {
        const params = new URLSearchParams({ limit: "100" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(4);
      });

      test("offset exceeding total count", async () => {
        const params = new URLSearchParams({ offset: "100" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(0);
      });

      test("limit of 0 should be rejected", async () => {
        const params = new URLSearchParams({ limit: "0" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("invalid limit parameter", async () => {
        const params = new URLSearchParams({ limit: "invalid" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("invalid offset parameter", async () => {
        const params = new URLSearchParams({ offset: "invalid" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("negative limit", async () => {
        const params = new URLSearchParams({ limit: "-1" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("negative offset", async () => {
        const params = new URLSearchParams({ offset: "-1" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });

      test("limit over maximum allowed", async () => {
        const params = new URLSearchParams({ limit: "101" });
        const response = await app.request(`/statuses?${params}`, {
          headers,
        });
        expect(response.status).toBe(400);
      });
    });

    describe("Content-Type and Response Format", () => {
      it("should return JSON content type", async () => {
        const response = await app.request("/statuses", {
          headers,
        });
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain(
          "application/json"
        );
      });

      it("should return valid JSON", async () => {
        const response = await app.request("/statuses", {
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
        const response = await app.request("/statuses?", {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(4);
      });

      it("should reject malformed query parameters", async () => {
        const response = await app.request("/statuses?limit=&offset=", {
          headers,
        });
        expect(response.status).toBe(400);
      });

      it("should reject duplicate query parameters", async () => {
        const response = await app.request("/statuses?limit=2&limit=3", {
          headers,
        });
        expect(response.status).toBe(400);
      });
    });
  });

  describe("POST /statuses", () => {
    it("should create a status with all fields", async () => {
      const statusData = {
        name: "In Progress",
        icon: "🔄",
        color: "#fbbf24",
      };

      const response = await app.request("/statuses", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.name).toBe(statusData.name);
      expect(data.icon).toBe(statusData.icon);
      expect(data.color).toBe(statusData.color);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(typeof data.id).toBe("string");
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it("should create a status with only required fields", async () => {
      const statusData = {
        name: "Minimal Status",
      };

      const response = await app.request("/statuses", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.name).toBe(statusData.name);
      expect(data.icon).toBeNull();
      expect(data.color).toBeNull();
      expect(data.organizationId).toBe(testData.organization.id);
    });
  });

  describe("GET /statuses/{id}", () => {
    it("should return a status by ID", async () => {
      // First get the list to find a valid status ID
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const firstStatus = statuses[0];

      const response = await app.request(`/statuses/${firstStatus.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(firstStatus.id);
      expect(data.name).toBe(firstStatus.name);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");
    });

    it("should return 404 for non-existent status", async () => {
      const response = await app.request("/statuses/non-existent-status", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const response = await app.request("/statuses/status-open");

      expect(response.status).toBe(401);
    });

    it("should enforce organization isolation", async () => {
      // Try to access a status from another organization
      const response = await app.request("/statuses/other-org-status-1", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should return JSON content type", async () => {
      const response = await app.request("/statuses/status-open", {
        headers,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return status with correct schema structure", async () => {
      // Get a valid status ID first
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const testStatus = statuses[1] || statuses[0]; // Use second status if available

      const response = await app.request(`/statuses/${testStatus.id}`, {
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

  describe("PATCH /statuses/{id}", () => {
    it("should update a status with all fields", async () => {
      // Get a status to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[0];

      const updateData = {
        name: "Updated Status",
        icon: "🔄",
        color: "#ff6b6b",
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(statusToUpdate.id);
      expect(data.name).toBe(updateData.name);
      expect(data.icon).toBe(updateData.icon);
      expect(data.color).toBe(updateData.color);
      expect(data.organizationId).toBe(testData.organization.id);
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");
    });

    it("should update a status with partial fields", async () => {
      // Get a different status to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[1] || statuses[0];
      const originalIcon = statusToUpdate.icon;
      const originalColor = statusToUpdate.color;

      const updateData = {
        name: "Partially Updated Status",
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(statusToUpdate.id);
      expect(data.name).toBe(updateData.name);
      expect(data.icon).toBe(originalIcon); // Should remain unchanged
      expect(data.color).toBe(originalColor); // Should remain unchanged
      expect(data.organizationId).toBe(testData.organization.id);
    });

    it("should update only icon", async () => {
      // Get another status to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[2] || statuses[0];
      const originalName = statusToUpdate.name;
      const originalColor = statusToUpdate.color;

      const updateData = {
        icon: "🎯",
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(statusToUpdate.id);
      expect(data.name).toBe(originalName); // Should remain unchanged
      expect(data.icon).toBe(updateData.icon);
      expect(data.color).toBe(originalColor); // Should remain unchanged
    });

    it("should update only color", async () => {
      // Get the last status to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[3] || statuses[0];
      const originalName = statusToUpdate.name;
      const originalIcon = statusToUpdate.icon;

      const updateData = {
        color: "#9333ea",
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(statusToUpdate.id);
      expect(data.name).toBe(originalName); // Should remain unchanged
      expect(data.icon).toBe(originalIcon); // Should remain unchanged
      expect(data.color).toBe(updateData.color);
    });

    it("should return 404 for non-existent status", async () => {
      const updateData = {
        name: "Updated Status",
      };

      const response = await app.request("/statuses/non-existent-status", {
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
        name: "Updated Status",
      };

      const response = await app.request("/statuses/status-open", {
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
        name: "Hacked Status",
      };

      // Try to update a status from another organization
      const response = await app.request("/statuses/other-org-status-1", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404);
    });

    it("should reject invalid JSON", async () => {
      // Get a status to try to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[0];

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(response.status).toBe(500); // Hono returns 500 for invalid JSON
    });

    it("should accept empty body for partial updates", async () => {
      // Get a status to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[0];

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Empty body should be valid for partial updates, no changes should occur
      expect(data.id).toBe(statusToUpdate.id);
      expect(data.organizationId).toBe(testData.organization.id);
    });

    it("should reject invalid name (too long)", async () => {
      // Get a status to try to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[0];

      const updateData = {
        name: "a".repeat(101), // Exceeds max length of 100
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(400);
    });

    it("should reject invalid name (empty string)", async () => {
      // Get a status to try to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[0];

      const updateData = {
        name: "",
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(400);
    });

    it("should return JSON content type", async () => {
      // Get a status to update
      const listResponse = await app.request("/statuses", {
        headers,
      });
      expect(listResponse.status).toBe(200);
      const statuses = await listResponse.json();
      const statusToUpdate = statuses[0];

      const updateData = {
        name: "Content Type Test",
      };

      const response = await app.request(`/statuses/${statusToUpdate.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });
});
