import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { app } from "../src";
import { adminDB } from "@repo/db/client";
import { statuses, organizations, Status } from "@repo/db/schema";

describe("Statuses", () => {
  let headers: Headers;
  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    testData = await generateTestData();
    await seedDatabase(testData);

    headers = new Headers({
      "x-api-key": testData.apiKey.key,
    });
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

    describe("HTTP methods", () => {
      it("should only accept GET requests", async () => {
        const methods = ["POST", "PUT", "PATCH", "DELETE"];

        for (const method of methods) {
          const response = await app.request("/statuses", {
            method,
            headers,
          });
          expect(response.status).toBe(404);
        }
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
});
