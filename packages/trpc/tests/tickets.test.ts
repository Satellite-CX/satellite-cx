import { adminDB } from "@repo/db/client";
import { organizations, tickets } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createTrpcCaller } from "../src";

describe("Ticket Mutations", () => {
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

  describe("Create ticket", () => {});

  describe("Delete ticket by ID", () => {
    it("should successfully delete an existing ticket", async () => {
      const allTickets = await caller.tickets.list();
      const ticketToDelete = allTickets[0]!;

      const result = await caller.tickets.delete({ id: ticketToDelete.id });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe("Ticket deleted successfully");

      // Verify ticket is actually deleted
      expect(caller.tickets.get({ id: ticketToDelete.id })).rejects.toThrow(
        "Ticket not found"
      );

      // Verify remaining tickets count
      const remainingTickets = await caller.tickets.list();
      expect(remainingTickets.length).toBe(allTickets.length - 1);
    });

    it("should throw NOT_FOUND error for non-existent ticket", async () => {
      expect(
        caller.tickets.delete({ id: "non-existent-ticket-id" })
      ).rejects.toThrow("Ticket not found");
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

      const [otherOrgTicket] = await adminDB
        .insert(tickets)
        .values({
          id: "other-org-delete-ticket",
          organizationId: otherOrg!.id,
          subject: "Ticket from other org for delete test",
          description: "This should not be deletable",
          createdAt: new Date(),
        })
        .returning();

      expect(caller.tickets.delete({ id: otherOrgTicket!.id })).rejects.toThrow(
        "Ticket not found"
      );
    });

    it("should validate input parameter", async () => {
      expect(
        // @ts-expect-error - missing required id parameter
        caller.tickets.delete({})
      ).rejects.toThrow();

      expect(
        // @ts-expect-error - id should be string
        caller.tickets.delete({ id: 123 })
      ).rejects.toThrow();
    });

    it("should return correct response schema", async () => {
      const allTickets = await caller.tickets.list();
      const ticketToDelete = allTickets[1]!; // Use second ticket to avoid conflicts

      const result = await caller.tickets.delete({ id: ticketToDelete.id });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
      expect(result.success).toBe(true);
    });
  });
});
