import { adminDB } from "@repo/db/client";
import { tickets, organizations } from "@repo/db/schema";
import {
  resetDatabase,
  seedDatabase,
  generateTestData,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createTrpcCaller } from "../src";
import { InferResultType } from "@repo/db";

describe("Query Tickets", () => {
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

  describe("Get ticket by ID", () => {
    it("should return a single ticket by ID", async () => {
      const allTickets = await caller.tickets.list();
      const firstTicket = allTickets[0]!;

      const result = await caller.tickets.get({ id: firstTicket.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(firstTicket.id);
      expect(result.subject).toBe(firstTicket.subject);
      expect(result.description).toBe(firstTicket.description);
      expect(result.organizationId).toBe(firstTicket.organizationId);
    });

    it("should throw NOT_FOUND error for non-existent ticket", async () => {
      expect(
        caller.tickets.get({ id: "non-existent-ticket-id" })
      ).rejects.toThrow("Ticket not found");
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

      const [otherOrgTicket] = await adminDB
        .insert(tickets)
        .values({
          id: "other-org-get-ticket",
          organizationId: otherOrg!.id,
          subject: "Ticket from other org for get test",
          description: "This should not be accessible",
          createdAt: new Date(),
        })
        .returning();

      expect(caller.tickets.get({ id: otherOrgTicket!.id })).rejects.toThrow(
        "Ticket not found"
      );
    });

    it("should validate input parameter", async () => {
      expect(
        // @ts-expect-error - missing required id parameter
        caller.tickets.get({})
      ).rejects.toThrow();

      expect(
        // @ts-expect-error - id should be string
        caller.tickets.get({ id: 123 })
      ).rejects.toThrow();
    });

    it("should return ticket with correct schema structure", async () => {
      const allTickets = await caller.tickets.list();
      const firstTicket = allTickets[0]!;

      const result = await caller.tickets.get({ id: firstTicket.id });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("organizationId");
      expect(result).toHaveProperty("subject");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("priority");
      expect(result).toHaveProperty("customerId");
      expect(result).toHaveProperty("assigneeId");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result).toHaveProperty("closedAt");

      expect(typeof result.id).toBe("string");
      expect(typeof result.subject).toBe("string");
      expect(typeof result.description).toBe("string");
    });
  });

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

  describe("Limit parameter", () => {
    it("should limit the number of tickets returned", async () => {
      const result = await caller.tickets.list({ limit: 2 });
      expect(result.length).toBe(2);
    });

    it("should return all tickets when limit exceeds total count", async () => {
      const result = await caller.tickets.list({ limit: 100 });
      expect(result.length).toBe(5);
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
        orderBy: { field: "subject", direction: "asc" },
        limit: 2,
        offset: 1,
      });

      expect(result.length).toBe(2);
    });
  });

  describe("With parameter", () => {
    it("should return tickets with status objects when with.status is true", async () => {
      const result = (await caller.tickets.list({
        with: { status: true },
      })) as InferResultType<"tickets", { status: true }>[];

      const ticket = result[0]!;
      expect(ticket.status).toBeDefined();
      expect(typeof ticket.status).toBe("object");

      expect(ticket.status!.id).toBeDefined();
      expect(ticket.status!.name).toBeDefined();
      expect(ticket.status!.icon).toBeDefined();
      expect(ticket.status!.color).toBeDefined();
    });

    it("should return tickets with priority objects when with.priority is true", async () => {
      const result = (await caller.tickets.list({
        with: { priority: true },
      })) as InferResultType<"tickets", { priority: true }>[];
      await caller.tickets.list({ with: { priority: true } });

      const ticket = result[0]!;
      expect(ticket.priority).toBeDefined();
      expect(typeof ticket.priority).toBe("object");

      expect(ticket.priority!.id).toBeDefined();
      expect(ticket.priority!.name).toBeDefined();
    });

    it("should return tickets with status strings when no with clause", async () => {
      const result = await caller.tickets.list();

      const ticket = result[0]!;
      expect(ticket.status).toBeDefined();
      expect(typeof ticket.status).toBe("string");

      expect(ticket.status).toEqual(expect.any(String));
    });
  });

  describe("Input validation and edge cases", () => {
    it("should reject invalid field names", async () => {
      expect(
        caller.tickets.list({
          // @ts-expect-error - invalid field name
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
