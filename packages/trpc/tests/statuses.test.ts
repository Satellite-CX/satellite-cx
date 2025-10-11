import { adminDB } from "@repo/db/client";
import { organizations, statuses } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
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
      const otherOrgStatuses = result.filter(
        (s) => s.organizationId === otherOrg!.id
      );
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
      expect(caller.statuses.list({ limit: 0 })).rejects.toThrow();
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
      // @ts-expect-error - Invalid limit
      expect(caller.statuses.list({ limit: "invalid" })).rejects.toThrow();
    });

    it("should validate offset parameter", async () => {
      // @ts-expect-error - Invalid offset
      expect(caller.statuses.list({ offset: "invalid" })).rejects.toThrow();
    });

    it("should handle negative limit", async () => {
      expect(caller.statuses.list({ limit: -1 })).rejects.toThrow();
    });

    it("should handle negative offset", async () => {
      expect(caller.statuses.list({ offset: -1 })).rejects.toThrow();
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
      const statusNames = result.map((s) => s.name).sort();
      expect(statusNames).toEqual(["Closed", "Open", "Pending", "Resolved"]);

      // Check that each status has the expected properties
      result.forEach((status) => {
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
      result.forEach((status) => {
        expect(status.organizationId).toBe(testData.organization.id);
      });
    });
  });

  describe("Create Status", () => {
    describe("Basic functionality", () => {
      it("should create a status with all fields", async () => {
        const statusData = {
          name: "In Progress",
          icon: "🔄",
          color: "#fbbf24",
        };

        const result = await caller.statuses.create(statusData);

        expect(result).toBeDefined();
        expect(result.name).toBe(statusData.name);
        expect(result.icon).toBe(statusData.icon);
        expect(result.color).toBe(statusData.color);
        expect(result.organizationId).toBe(testData.organization.id);
        expect(typeof result.id).toBe("string");
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it("should create a status with only required fields", async () => {
        const statusData = {
          name: "Minimal Status",
        };

        const result = await caller.statuses.create(statusData);

        expect(result).toBeDefined();
        expect(result.name).toBe(statusData.name);
        expect(result.icon).toBeNull();
        expect(result.color).toBeNull();
        expect(result.organizationId).toBe(testData.organization.id);
      });

      it("should automatically assign the organization ID from session", async () => {
        const statusData = {
          name: "Auto Org Status",
        };

        const result = await caller.statuses.create(statusData);

        expect(result.organizationId).toBe(testData.organization.id);
      });

      it("should be visible in status list after creation", async () => {
        const statusData = {
          name: "List Visibility Test",
          icon: "🔍",
        };

        const initialList = await caller.statuses.list();
        const initialCount = initialList.length;

        await caller.statuses.create(statusData);

        const updatedList = await caller.statuses.list();
        expect(updatedList.length).toBe(initialCount + 1);

        const newStatus = updatedList.find((s) => s.name === statusData.name);
        expect(newStatus).toBeDefined();
        expect(newStatus!.icon).toBe(statusData.icon);
      });
    });

    describe("Input validation", () => {
      it("should reject empty name", async () => {
        const statusData = {
          name: "",
        };

        expect(caller.statuses.create(statusData)).rejects.toThrow();
      });

      it("should reject name that's too long", async () => {
        const statusData = {
          name: "x".repeat(101), // 101 characters
        };

        expect(caller.statuses.create(statusData)).rejects.toThrow();
      });

      it("should reject missing name", async () => {
        const statusData = {
          icon: "🔄",
          color: "#fbbf24",
        };

        // @ts-expect-error - Missing name
        expect(caller.statuses.create(statusData)).rejects.toThrow();
      });

      it("should accept name at maximum length", async () => {
        const statusData = {
          name: "x".repeat(100), // Exactly 100 characters
        };

        const result = await caller.statuses.create(statusData);
        expect(result.name).toBe(statusData.name);
      });
    });

    describe("Optional fields", () => {
      it("should handle undefined optional fields", async () => {
        const statusData = {
          name: "Undefined Optional Fields",
          icon: undefined,
          color: undefined,
        };

        const result = await caller.statuses.create(statusData);
        expect(result.icon).toBeNull();
        expect(result.color).toBeNull();
      });

      it("should accept valid icon", async () => {
        const statusData = {
          name: "Icon Test",
          icon: "🎯",
        };

        const result = await caller.statuses.create(statusData);
        expect(result.icon).toBe("🎯");
      });

      it("should accept valid color", async () => {
        const statusData = {
          name: "Color Test",
          color: "#3b82f6",
        };

        const result = await caller.statuses.create(statusData);
        expect(result.color).toBe("#3b82f6");
      });
    });

    describe("Organization isolation", () => {
      it("should only create status in user's organization", async () => {
        const statusData = {
          name: "Isolation Test Status",
          icon: "🔒",
        };

        const result = await caller.statuses.create(statusData);

        // Verify the status belongs to the correct organization
        expect(result.organizationId).toBe(testData.organization.id);

        // Verify it doesn't appear in other organizations
        const [otherOrg] = await adminDB
          .insert(organizations)
          .values({
            id: "create-isolation-test-org",
            name: "Create Isolation Test Org",
            slug: "create-isolation-test-org",
            createdAt: new Date(),
          })
          .returning();

        // Check that the status doesn't exist in the other organization's context
        const otherOrgStatuses = await adminDB.query.statuses.findMany({
          where: (statuses, { eq }) =>
            eq(statuses.organizationId, otherOrg!.id),
        });

        const hasTestStatus = otherOrgStatuses.some(
          (s) => s.name === statusData.name
        );
        expect(hasTestStatus).toBe(false);
      });
    });

    describe("Response schema validation", () => {
      it("should return status with correct schema structure", async () => {
        const statusData = {
          name: "Schema Test Status",
          icon: "📋",
          color: "#e11d48",
        };

        const result = await caller.statuses.create(statusData);

        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("organizationId");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("icon");
        expect(result).toHaveProperty("color");
        expect(result).toHaveProperty("createdAt");
        expect(result).toHaveProperty("updatedAt");

        expect(typeof result.id).toBe("string");
        expect(typeof result.organizationId).toBe("string");
        expect(typeof result.name).toBe("string");
        expect(result.organizationId).toBe(testData.organization.id);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe("Get Status", () => {
    let statusId: string;

    beforeEach(async () => {
      const result = await caller.statuses.create({
        name: "Get Status Test",
        icon: "📋",
        color: "#e11d48",
      });
      statusId = result.id;
    });

    it("should get a status by id", async () => {
      const statusData = {
        id: statusId,
      };
      const result = await caller.statuses.get({ id: statusData.id });
      expect(result).toBeDefined();
      expect(result.id).toBe(statusId);
      expect(result.name).toBe("Get Status Test");
      expect(result.icon).toBe("📋");
      expect(result.color).toBe("#e11d48");
    });
  });

  describe("Update Status", () => {
    let statusId: string;

    beforeEach(async () => {
      const result = await caller.statuses.create({
        name: "Update Status Test",
        icon: "📋",
        color: "#e11d48",
      });
      statusId = result.id;
    });

    it("should update a status with all fields", async () => {
      const statusData = {
        id: statusId,
        values: {
          name: "Updated Status",
          icon: "�",
          color: "#3b82f6",
        },
      };
      const result = await caller.statuses.update(statusData);
      expect(result).toBeDefined();
      expect(result.name).toBe(statusData.values.name);
      expect(result.icon).toBe(statusData.values.icon);
      expect(result.color).toBe(statusData.values.color);

      const updatedStatus = await caller.statuses.get({ id: statusData.id });
      expect(updatedStatus).toBeDefined();
      expect(updatedStatus.name).toBe(statusData.values.name);
      expect(updatedStatus.icon).toBe(statusData.values.icon);
      expect(updatedStatus.color).toBe(statusData.values.color);
    });
  });

  describe("Delete Status", () => {
    let statusId: string;

    beforeEach(async () => {
      const result = await caller.statuses.create({
        name: "Delete Status Test",
        icon: "🗑️",
        color: "#ef4444",
      });
      statusId = result.id;
    });

    it("should delete a status by id", async () => {
      const result = await caller.statuses.delete({ id: statusId });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the status is no longer accessible
      expect(caller.statuses.get({ id: statusId })).rejects.toThrow("Status not found");
    });

    it("should remove deleted status from list", async () => {
      const initialList = await caller.statuses.list();
      const initialCount = initialList.length;

      await caller.statuses.delete({ id: statusId });

      const updatedList = await caller.statuses.list();
      expect(updatedList.length).toBe(initialCount - 1);

      const deletedStatus = updatedList.find((s) => s.id === statusId);
      expect(deletedStatus).toBeUndefined();
    });

    it("should throw error when deleting non-existent status", async () => {
      expect(caller.statuses.delete({ id: "non-existent-id" })).rejects.toThrow("Status not found");
    });

    it("should only delete status from user's organization", async () => {
      // Create another organization with a status
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "delete-isolation-test-org",
          name: "Delete Isolation Test Org",
          slug: "delete-isolation-test-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgStatus] = await adminDB
        .insert(statuses)
        .values({
          id: "other-org-status-delete",
          organizationId: otherOrg!.id,
          name: "Other Org Status",
          icon: "🔹",
          color: "purple",
          createdAt: new Date(),
        })
        .returning();

      // Try to delete the other organization's status - should fail
      expect(caller.statuses.delete({ id: otherOrgStatus!.id })).rejects.toThrow("Status not found");

      // Verify the other org's status still exists
      const otherOrgStatuses = await adminDB.query.statuses.findMany({
        where: (statuses, { eq }) => eq(statuses.organizationId, otherOrg!.id),
      });
      expect(otherOrgStatuses.length).toBe(1);
      expect(otherOrgStatuses[0]!.id).toBe(otherOrgStatus!.id);
    });

    it("should return correct response schema", async () => {
      const result = await caller.statuses.delete({ id: statusId });

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
      expect(result.success).toBe(true);
    });
  });
});
