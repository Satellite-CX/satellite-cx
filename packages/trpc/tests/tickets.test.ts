import { adminDB } from "@repo/db/client";
import { tickets, organizations } from "@repo/db/schema";
import { resetDatabase, seedDatabase } from "@repo/db/utils";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createTrpcCaller } from "../src";
import { generateTestData } from "./generate-test-data";

describe("Tickets", () => {
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
    it("should return a list of tickets", async () => {
      const result = await caller.tickets.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it("should return tickets only from the user's organization", async () => {
      const [otherOrg] = await adminDB
        .insert(organizations)
        .values({
          id: "other-org-id",
          name: "Other Org",
          slug: "other-org",
          createdAt: new Date(),
        })
        .returning();

      await adminDB.insert(tickets).values({
        id: "other-org-ticket",
        organizationId: otherOrg!.id,
        subject: "Ticket from other org",
        description: "This should not appear in results",
        createdAt: new Date(),
      });

      const result = await caller.tickets.list();
      expect(result.length).toBe(5);
    });
  });

  describe("Limit parameter", () => {
    it("should limit the number of tickets returned", async () => {
      const result = await caller.tickets.list({ limit: 2 });
      expect(result.length).toBe(2);
    });

    it("should return all tickets when limit exceeds total count", async () => {
      const result = await caller.tickets.list({ limit: 100 });
      expect(result.length).toBe(5);
    });

    it("should return empty array when limit is 0", async () => {
      const result = await caller.tickets.list({ limit: 0 });
      expect(result.length).toBe(0);
    });
  });

  describe("Offset parameter", () => {
    it("should skip tickets based on offset", async () => {
      const allTickets = await caller.tickets.list();
      const offsetTickets = await caller.tickets.list({ offset: 2 });

      expect(offsetTickets.length).toBe(3);
      expect(offsetTickets[0]!.id).toBe(allTickets[2]!.id);
    });

    it("should return empty array when offset exceeds total count", async () => {
      const result = await caller.tickets.list({ offset: 100 });
      expect(result.length).toBe(0);
    });

    it("should work with both limit and offset", async () => {
      const result = await caller.tickets.list({ limit: 2, offset: 1 });
      expect(result.length).toBe(2);
    });
  });

  describe("OrderBy parameter", () => {
    it("should sort by createdAt ascending", async () => {
      const result = await caller.tickets.list({
        orderBy: { field: "createdAt", direction: "asc" },
      });

      expect(new Date(result[0]!.createdAt!).getTime()).toBeLessThan(
        new Date(result[1]!.createdAt!).getTime()
      );
    });

    it("should sort by createdAt descending (default)", async () => {
      const result = await caller.tickets.list({
        orderBy: { field: "createdAt", direction: "desc" },
      });

      expect(new Date(result[0]!.createdAt!).getTime()).toBeGreaterThan(
        new Date(result[1]!.createdAt!).getTime()
      );
    });

    it("should sort by subject alphabetically", async () => {
      const result = await caller.tickets.list({
        orderBy: { field: "subject", direction: "asc" },
      });

      expect(
        result[0]!.subject.localeCompare(result[1]!.subject)
      ).toBeLessThanOrEqual(0);
    });

    it("should sort by updatedAt", async () => {
      const result = await caller.tickets.list({
        orderBy: { field: "updatedAt", direction: "desc" },
      });

      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i]!.updatedAt!).getTime();
        const next = new Date(result[i + 1]!.updatedAt!).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("should sort by multiple columns with limit and offset", async () => {
      const result = await caller.tickets.list({
        orderBy: { field: "priority", direction: "asc" },
        limit: 2,
        offset: 1,
      });

      expect(result.length).toBe(2);
    });
  });

  describe("Input validation and edge cases", () => {
    it("should reject invalid field names", async () => {
      expect(
        caller.tickets.list({
          // @ts-expect-error Testing invalid field
          orderBy: { field: "invalidField", direction: "asc" },
        })
      ).rejects.toThrow();
    });

    it("should return default order when no orderBy is specified", async () => {
      const result = await caller.tickets.list();
      expect(new Date(result[0]!.createdAt!).getTime()).toBeGreaterThan(
        new Date(result[result.length - 1]!.createdAt!).getTime()
      );
    });

    it("should handle null/undefined input gracefully", async () => {
      const result = await caller.tickets.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
