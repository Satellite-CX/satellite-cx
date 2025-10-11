import { adminDB } from "@repo/db/client";
import { organizations, priorities } from "@repo/db/schema";
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

describe("Priorities", () => {
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
    it("should return a list of priorities", async () => {
      const result = await caller.priorities.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4); // Based on seed data: Low, Medium, High, Critical
    });

    it("should return priorities only from the user's organization", async () => {
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "other-org-id",
          name: "Other Org",
          slug: "other-org",
          createdAt: new Date(),
        })
        .returning();

      await adminDB.insert(priorities).values({
        id: "other-org-priority",
        organizationId: otherOrg!.id,
        name: "Other Org Priority",
        icon: "🔹",
        color: "purple",
        createdAt: new Date(),
      });

      const result = await caller.priorities.list();
      expect(result.length).toBe(4); // Should still be 4, not 5

      // Verify none of the returned priorities belong to the other org
      const otherOrgPriorities = result.filter(
        (p) => p.organizationId === otherOrg!.id
      );
      expect(otherOrgPriorities.length).toBe(0);
    });

    it("should return priorities ordered by name alphabetically", async () => {
      const result = await caller.priorities.list();

      // Verify priorities are ordered alphabetically
      const priorityNames = result.map(p => p.name);
      const sortedNames = [...priorityNames].sort();
      expect(priorityNames).toEqual(sortedNames);

      // Verify we have the expected number of priorities
      expect(result.length).toBe(4);
    });
  });

  describe("Limit parameter", () => {
    it("should limit the number of priorities returned", async () => {
      const result = await caller.priorities.list({ limit: 2 });
      expect(result.length).toBe(2);
    });

    it("should return all priorities when limit exceeds total count", async () => {
      const result = await caller.priorities.list({ limit: 100 });
      expect(result.length).toBe(4);
    });

    it("should reject limit of 0", async () => {
      expect(caller.priorities.list({ limit: 0 })).rejects.toThrow();
    });
  });

  describe("Offset parameter", () => {
    it("should skip priorities based on offset", async () => {
      const allPriorities = await caller.priorities.list();
      const offsetPriorities = await caller.priorities.list({ offset: 2 });

      expect(offsetPriorities.length).toBe(2);
      expect(offsetPriorities[0]!.id).toBe(allPriorities[2]!.id);
    });

    it("should return empty array when offset exceeds total count", async () => {
      const result = await caller.priorities.list({ offset: 100 });
      expect(result.length).toBe(0);
    });

    it("should work with both limit and offset", async () => {
      const result = await caller.priorities.list({ limit: 2, offset: 1 });
      expect(result.length).toBe(2);
    });
  });

  describe("Input validation and edge cases", () => {
    it("should handle null/undefined input gracefully", async () => {
      const result = await caller.priorities.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should validate limit parameter", async () => {
      // @ts-expect-error - Invalid limit
      expect(caller.priorities.list({ limit: "invalid" })).rejects.toThrow();
    });

    it("should validate offset parameter", async () => {
      // @ts-expect-error - Invalid offset
      expect(caller.priorities.list({ offset: "invalid" })).rejects.toThrow();
    });

    it("should handle negative limit", async () => {
      expect(caller.priorities.list({ limit: -1 })).rejects.toThrow();
    });

    it("should handle negative offset", async () => {
      expect(caller.priorities.list({ offset: -1 })).rejects.toThrow();
    });
  });

  describe("Response schema validation", () => {
    it("should return priorities with correct schema structure", async () => {
      const result = await caller.priorities.list();
      const priority = result[0]!;

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
      const result = await caller.priorities.list();

      // Check that we have the expected number of priorities
      expect(result.length).toBe(4);

      // Check that each priority has the expected properties
      result.forEach((priority) => {
        expect(priority.id).toMatch(/^priority-/);
        expect(typeof priority.name).toBe("string");
        expect(priority.name.length).toBeGreaterThan(0);

        // Verify we have valid emojis and colors (non-empty strings)
        if (priority.icon) {
          expect(typeof priority.icon).toBe("string");
          expect(priority.icon.length).toBeGreaterThan(0);
        }
        if (priority.color) {
          expect(typeof priority.color).toBe("string");
          expect(priority.color.length).toBeGreaterThan(0);
        }
      });

      // Verify all priority names are unique
      const priorityNames = result.map(p => p.name);
      const uniqueNames = new Set(priorityNames);
      expect(uniqueNames.size).toBe(priorityNames.length);
    });
  });

  describe("Organization isolation", () => {
    it("should enforce strict organization boundaries", async () => {
      // Create another organization with its own priorities
      const [org2] = await adminDB
        .insert(organizations)
        .values({
          id: "isolation-test-org",
          name: "Isolation Test Org",
          slug: "isolation-test-org",
          createdAt: new Date(),
        })
        .returning();

      // Add some priorities to the other organization
      await adminDB.insert(priorities).values([
        {
          id: "org2-priority-1",
          organizationId: org2!.id,
          name: "Org2 Priority 1",
          icon: "🟦",
          color: "cyan",
          createdAt: new Date(),
        },
        {
          id: "org2-priority-2",
          organizationId: org2!.id,
          name: "Org2 Priority 2",
          icon: "🟪",
          color: "magenta",
          createdAt: new Date(),
        },
      ]);

      // Verify current user only sees their org's priorities
      const result = await caller.priorities.list();
      expect(result.length).toBe(4);

      // Verify all returned priorities belong to the test organization
      result.forEach((priority) => {
        expect(priority.organizationId).toBe(testData.organization.id);
      });
    });
  });

  describe("Create Priority", () => {
    describe("Basic functionality", () => {
      it("should create a priority with all fields", async () => {
        const priorityData = {
          name: "Urgent",
          icon: "🚨",
          color: "#ef4444",
        };

        const result = await caller.priorities.create(priorityData);

        expect(result).toBeDefined();
        expect(result.name).toBe(priorityData.name);
        expect(result.icon).toBe(priorityData.icon);
        expect(result.color).toBe(priorityData.color);
        expect(result.organizationId).toBe(testData.organization.id);
        expect(typeof result.id).toBe("string");
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it("should create a priority with only required fields", async () => {
        const priorityData = {
          name: "Minimal Priority",
        };

        const result = await caller.priorities.create(priorityData);

        expect(result).toBeDefined();
        expect(result.name).toBe(priorityData.name);
        expect(result.icon).toBeNull();
        expect(result.color).toBeNull();
        expect(result.organizationId).toBe(testData.organization.id);
      });

      it("should automatically assign the organization ID from session", async () => {
        const priorityData = {
          name: "Auto Org Priority",
        };

        const result = await caller.priorities.create(priorityData);

        expect(result.organizationId).toBe(testData.organization.id);
      });

      it("should be visible in priority list after creation", async () => {
        const priorityData = {
          name: "List Visibility Test",
          icon: "🔍",
        };

        const initialList = await caller.priorities.list();
        const initialCount = initialList.length;

        await caller.priorities.create(priorityData);

        const updatedList = await caller.priorities.list();
        expect(updatedList.length).toBe(initialCount + 1);

        const newPriority = updatedList.find((p) => p.name === priorityData.name);
        expect(newPriority).toBeDefined();
        expect(newPriority!.icon).toBe(priorityData.icon);
      });
    });

    describe("Input validation", () => {
      it("should reject empty name", async () => {
        const priorityData = {
          name: "",
        };

        expect(caller.priorities.create(priorityData)).rejects.toThrow();
      });

      it("should reject name that's too long", async () => {
        const priorityData = {
          name: "x".repeat(101), // 101 characters
        };

        expect(caller.priorities.create(priorityData)).rejects.toThrow();
      });

      it("should reject missing name", async () => {
        const priorityData = {
          icon: "🔄",
          color: "#fbbf24",
        };

        // @ts-expect-error - Missing name
        expect(caller.priorities.create(priorityData)).rejects.toThrow();
      });

      it("should accept name at maximum length", async () => {
        const priorityData = {
          name: "x".repeat(100), // Exactly 100 characters
        };

        const result = await caller.priorities.create(priorityData);
        expect(result.name).toBe(priorityData.name);
      });
    });

    describe("Optional fields", () => {
      it("should handle undefined optional fields", async () => {
        const priorityData = {
          name: "Undefined Optional Fields",
          icon: undefined,
          color: undefined,
        };

        const result = await caller.priorities.create(priorityData);
        expect(result.icon).toBeNull();
        expect(result.color).toBeNull();
      });

      it("should accept valid icon", async () => {
        const priorityData = {
          name: "Icon Test",
          icon: "🎯",
        };

        const result = await caller.priorities.create(priorityData);
        expect(result.icon).toBe("🎯");
      });

      it("should accept valid color", async () => {
        const priorityData = {
          name: "Color Test",
          color: "#3b82f6",
        };

        const result = await caller.priorities.create(priorityData);
        expect(result.color).toBe("#3b82f6");
      });
    });

    describe("Organization isolation", () => {
      it("should only create priority in user's organization", async () => {
        const priorityData = {
          name: "Isolation Test Priority",
          icon: "🔒",
        };

        const result = await caller.priorities.create(priorityData);

        // Verify the priority belongs to the correct organization
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

        // Check that the priority doesn't exist in the other organization's context
        const otherOrgPriorities = await adminDB.query.priorities.findMany({
          where: (priorities, { eq }) =>
            eq(priorities.organizationId, otherOrg!.id),
        });

        const hasTestPriority = otherOrgPriorities.some(
          (p) => p.name === priorityData.name
        );
        expect(hasTestPriority).toBe(false);
      });
    });

    describe("Response schema validation", () => {
      it("should return priority with correct schema structure", async () => {
        const priorityData = {
          name: "Schema Test Priority",
          icon: "📋",
          color: "#e11d48",
        };

        const result = await caller.priorities.create(priorityData);

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

  describe("Get Priority", () => {
    let priorityId: string;

    beforeEach(async () => {
      const result = await caller.priorities.create({
        name: "Get Priority Test",
        icon: "📋",
        color: "#e11d48",
      });
      priorityId = result.id;
    });

    it("should get a priority by id", async () => {
      const priorityData = {
        id: priorityId,
      };
      const result = await caller.priorities.get({ id: priorityData.id });
      expect(result).toBeDefined();
      expect(result.id).toBe(priorityId);
      expect(result.name).toBe("Get Priority Test");
      expect(result.icon).toBe("📋");
      expect(result.color).toBe("#e11d48");
    });

    it("should throw error when getting non-existent priority", async () => {
      expect(caller.priorities.get({ id: "non-existent-id" })).rejects.toThrow("Priority not found");
    });

    it("should only get priority from user's organization", async () => {
      // Create another organization with a priority
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "get-isolation-test-org",
          name: "Get Isolation Test Org",
          slug: "get-isolation-test-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgPriority] = await adminDB
        .insert(priorities)
        .values({
          id: "other-org-priority-get",
          organizationId: otherOrg!.id,
          name: "Other Org Priority",
          icon: "🔹",
          color: "purple",
          createdAt: new Date(),
        })
        .returning();

      // Try to get the other organization's priority - should fail
      expect(caller.priorities.get({ id: otherOrgPriority!.id })).rejects.toThrow("Priority not found");
    });
  });

  describe("Update Priority", () => {
    let priorityId: string;

    beforeEach(async () => {
      const result = await caller.priorities.create({
        name: "Update Priority Test",
        icon: "📋",
        color: "#e11d48",
      });
      priorityId = result.id;
    });

    it("should update a priority with all fields", async () => {
      const priorityData = {
        id: priorityId,
        values: {
          name: "Updated Priority",
          icon: "🔄",
          color: "#3b82f6",
        },
      };
      const result = await caller.priorities.update(priorityData);
      expect(result).toBeDefined();
      expect(result.name).toBe(priorityData.values.name);
      expect(result.icon).toBe(priorityData.values.icon);
      expect(result.color).toBe(priorityData.values.color);

      const updatedPriority = await caller.priorities.get({ id: priorityData.id });
      expect(updatedPriority).toBeDefined();
      expect(updatedPriority.name).toBe(priorityData.values.name);
      expect(updatedPriority.icon).toBe(priorityData.values.icon);
      expect(updatedPriority.color).toBe(priorityData.values.color);
    });

    it("should update a priority with partial fields", async () => {
      const priorityData = {
        id: priorityId,
        values: {
          name: "Partially Updated Priority",
        },
      };
      const result = await caller.priorities.update(priorityData);
      expect(result).toBeDefined();
      expect(result.name).toBe(priorityData.values.name);
      expect(result.icon).toBe("📋"); // Should remain unchanged
      expect(result.color).toBe("#e11d48"); // Should remain unchanged
    });

    it("should throw error when updating non-existent priority", async () => {
      expect(caller.priorities.update({ id: "non-existent-id", values: { name: "Test" } })).rejects.toThrow("Priority not found");
    });

    it("should only update priority from user's organization", async () => {
      // Create another organization with a priority
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "update-isolation-test-org",
          name: "Update Isolation Test Org",
          slug: "update-isolation-test-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgPriority] = await adminDB
        .insert(priorities)
        .values({
          id: "other-org-priority-update",
          organizationId: otherOrg!.id,
          name: "Other Org Priority",
          icon: "🔹",
          color: "purple",
          createdAt: new Date(),
        })
        .returning();

      // Try to update the other organization's priority - should fail
      expect(caller.priorities.update({
        id: otherOrgPriority!.id,
        values: { name: "Updated Name" }
      })).rejects.toThrow("Priority not found");

      // Verify the other org's priority remains unchanged
      const otherOrgPriorities = await adminDB.query.priorities.findMany({
        where: (priorities, { eq }) => eq(priorities.organizationId, otherOrg!.id),
      });
      expect(otherOrgPriorities[0]!.name).toBe("Other Org Priority");
    });
  });

  describe("Delete Priority", () => {
    let priorityId: string;

    beforeEach(async () => {
      const result = await caller.priorities.create({
        name: "Delete Priority Test",
        icon: "🗑️",
        color: "#ef4444",
      });
      priorityId = result.id;
    });

    it("should delete a priority by id", async () => {
      const result = await caller.priorities.delete({ id: priorityId });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the priority is no longer accessible
      expect(caller.priorities.get({ id: priorityId })).rejects.toThrow("Priority not found");
    });

    it("should remove deleted priority from list", async () => {
      const initialList = await caller.priorities.list();
      const initialCount = initialList.length;

      await caller.priorities.delete({ id: priorityId });

      const updatedList = await caller.priorities.list();
      expect(updatedList.length).toBe(initialCount - 1);

      const deletedPriority = updatedList.find((p) => p.id === priorityId);
      expect(deletedPriority).toBeUndefined();
    });

    it("should throw error when deleting non-existent priority", async () => {
      expect(caller.priorities.delete({ id: "non-existent-id" })).rejects.toThrow("Priority not found");
    });

    it("should only delete priority from user's organization", async () => {
      // Create another organization with a priority
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "delete-isolation-test-org",
          name: "Delete Isolation Test Org",
          slug: "delete-isolation-test-org",
          createdAt: new Date(),
        })
        .returning();

      const [otherOrgPriority] = await adminDB
        .insert(priorities)
        .values({
          id: "other-org-priority-delete",
          organizationId: otherOrg!.id,
          name: "Other Org Priority",
          icon: "🔹",
          color: "purple",
          createdAt: new Date(),
        })
        .returning();

      // Try to delete the other organization's priority - should fail
      expect(caller.priorities.delete({ id: otherOrgPriority!.id })).rejects.toThrow("Priority not found");

      // Verify the other org's priority still exists
      const otherOrgPriorities = await adminDB.query.priorities.findMany({
        where: (priorities, { eq }) => eq(priorities.organizationId, otherOrg!.id),
      });
      expect(otherOrgPriorities.length).toBe(1);
      expect(otherOrgPriorities[0]!.id).toBe(otherOrgPriority!.id);
    });

    it("should return correct response schema", async () => {
      const result = await caller.priorities.delete({ id: priorityId });

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
      expect(result.success).toBe(true);
    });
  });
});