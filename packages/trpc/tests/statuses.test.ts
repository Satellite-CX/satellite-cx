import { adminDB } from "@repo/db/client";
import { statuses, organizations } from "@repo/db/schema";
import {
  resetDatabase,
  seedDatabase,
  generateTestData,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createTrpcCaller } from "../src";

describe("Statuses", () => {
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

  describe("Basic functionality", () => {
    it("should return a list of statuses", async () => {
      const result = await caller.statuses.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4); // Based on seed data: Open, Pending, Resolved, Closed
    });

    it("should return statuses only from the user's organization", async () => {
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "other-org-id",
          name: "Other Org",
          slug: "other-org",
          createdAt: new Date(),
        })
        .returning();

      await adminDB.insert(statuses).values({
        id: "other-org-status",
        organizationId: otherOrg!.id,
        name: "Other Org Status",
        icon: "🔹",
        color: "purple",
        createdAt: new Date(),
      });

      const result = await caller.statuses.list();
      expect(result.length).toBe(4); // Should still be 4, not 5

      // Verify none of the returned statuses belong to the other org
      const otherOrgStatuses = result.filter(s => s.organizationId === otherOrg!.id);
      expect(otherOrgStatuses.length).toBe(0);
    });

    it("should return statuses ordered by name alphabetically", async () => {
      const result = await caller.statuses.list();

      // Based on seed data: ["Open", "Pending", "Resolved", "Closed"]
      // Alphabetically: ["Closed", "Open", "Pending", "Resolved"]
      expect(result[0]!.name).toBe("Closed");
      expect(result[1]!.name).toBe("Open");
      expect(result[2]!.name).toBe("Pending");
      expect(result[3]!.name).toBe("Resolved");
    });
  });

  describe("Limit parameter", () => {
    it("should limit the number of statuses returned", async () => {
      const result = await caller.statuses.list({ limit: 2 });
      expect(result.length).toBe(2);
    });

    it("should return all statuses when limit exceeds total count", async () => {
      const result = await caller.statuses.list({ limit: 100 });
      expect(result.length).toBe(4);
    });

    it("should reject limit of 0", async () => {
      expect(
        caller.statuses.list({ limit: 0 })
      ).rejects.toThrow();
    });
  });

  describe("Offset parameter", () => {
    it("should skip statuses based on offset", async () => {
      const allStatuses = await caller.statuses.list();
      const offsetStatuses = await caller.statuses.list({ offset: 2 });

      expect(offsetStatuses.length).toBe(2);
      expect(offsetStatuses[0]!.id).toBe(allStatuses[2]!.id);
    });

    it("should return empty array when offset exceeds total count", async () => {
      const result = await caller.statuses.list({ offset: 100 });
      expect(result.length).toBe(0);
    });

    it("should work with both limit and offset", async () => {
      const result = await caller.statuses.list({ limit: 2, offset: 1 });
      expect(result.length).toBe(2);
    });
  });

  describe("Input validation and edge cases", () => {
    it("should handle null/undefined input gracefully", async () => {
      const result = await caller.statuses.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should validate limit parameter", async () => {
      expect(
        caller.statuses.list({ limit: "invalid" as any })
      ).rejects.toThrow();
    });

    it("should validate offset parameter", async () => {
      expect(
        caller.statuses.list({ offset: "invalid" as any })
      ).rejects.toThrow();
    });

    it("should handle negative limit", async () => {
      expect(
        caller.statuses.list({ limit: -1 })
      ).rejects.toThrow();
    });

    it("should handle negative offset", async () => {
      expect(
        caller.statuses.list({ offset: -1 })
      ).rejects.toThrow();
    });
  });

  describe("Response schema validation", () => {
    it("should return statuses with correct schema structure", async () => {
      const result = await caller.statuses.list();
      const status = result[0]!;

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
      const result = await caller.statuses.list();

      // Check that we have the expected status names from seed data
      const statusNames = result.map(s => s.name).sort();
      expect(statusNames).toEqual(["Closed", "Open", "Pending", "Resolved"]);

      // Check that each status has the expected properties
      result.forEach(status => {
        expect(status.id).toMatch(/^status-/);
        if (status.icon) {
          expect(["📋", "⏳", "✅", "🔒"]).toContain(status.icon);
        }
        if (status.color) {
          expect(["blue", "yellow", "green", "red"]).toContain(status.color);
        }
      });
    });
  });

  describe("Organization isolation", () => {
    it("should enforce strict organization boundaries", async () => {
      // Create another organization with its own statuses
      const [org2] = await adminDB
        .insert(organizations)
        .values({
          id: "isolation-test-org",
          name: "Isolation Test Org",
          slug: "isolation-test-org",
          createdAt: new Date(),
        })
        .returning();

      // Add some statuses to the other organization
      await adminDB.insert(statuses).values([
        {
          id: "org2-status-1",
          organizationId: org2!.id,
          name: "Org2 Status 1",
          icon: "🟦",
          color: "cyan",
          createdAt: new Date(),
        },
        {
          id: "org2-status-2",
          organizationId: org2!.id,
          name: "Org2 Status 2",
          icon: "🟪",
          color: "magenta",
          createdAt: new Date(),
        },
      ]);

      // Verify current user only sees their org's statuses
      const result = await caller.statuses.list();
      expect(result.length).toBe(4);

      // Verify all returned statuses belong to the test organization
      result.forEach(status => {
        expect(status.organizationId).toBe(testData.organization.id);
      });
    });
  });
});