import { Ticket } from "@repo/db/schema";
import {
  generateTestData,
  resetDatabase,
  seedDatabase,
} from "@repo/db/test-utils";
import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { app } from "../src";

describe("Tickets", () => {
  let headers: Headers;
  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    testData = await generateTestData();

    await seedDatabase({
      testData,
      ticketCount: 12,
    });

    headers = new Headers({
      "x-api-key": testData.apiKey.key,
    });
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("GET /tickets", () => {
    it("should return a list of tickets", async () => {
      const response = await app.request("/tickets", {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(12);
      expect(
        data.every(
          (ticket: Ticket) => ticket.organizationId === testData.organization.id
        )
      ).toBe(true);
    });

    describe("Query params", () => {
      test("limit", async () => {
        const params = new URLSearchParams({ limit: "5" });
        const response = await app.request(`/tickets?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(5);
      });

      test("offset", async () => {
        const params = new URLSearchParams({ offset: "5" });
        const response = await app.request(`/tickets?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveLength(7);
      });

      test("orderBy ascending", async () => {
        const params = new URLSearchParams({
          orderBy: JSON.stringify({ field: "subject", direction: "asc" }),
        });
        const response = await app.request(`/tickets?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        const subjects = data.map((ticket: Ticket) => ticket.subject);
        const sortedSubjects = [...subjects].sort();
        expect(subjects).toEqual(sortedSubjects);
      });

      test("orderBy descending", async () => {
        const params = new URLSearchParams({
          orderBy: JSON.stringify({ field: "subject", direction: "desc" }),
        });
        const response = await app.request(`/tickets?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        const subjects = data.map((ticket: Ticket) => ticket.subject);
        const sortedSubjects = [...subjects].sort().reverse();
        expect(subjects).toEqual(sortedSubjects);
      });

      test("with status", async () => {
        const params = new URLSearchParams({ with: "status" });
        const response = await app.request(`/tickets?${params}`, {
          headers,
        });
        expect(response.status).toBe(200);
      });
    });
  });

  describe("GET /tickets/{id}", () => {
    it("should return a single ticket by ID", async () => {
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const firstTicket = tickets[0];

      const response = await app.request(`/tickets/${firstTicket.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(firstTicket.id);
      expect(data.subject).toBe(firstTicket.subject);
      expect(data.description).toBe(firstTicket.description);
      expect(data.organizationId).toBe(testData.organization.id);
    });

    it("should return 404 for non-existent ticket", async () => {
      const response = await app.request("/tickets/non-existent-id", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should enforce organization isolation", async () => {
      const response = await app.request("/tickets/other-org-ticket-id", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const firstTicket = tickets[0];

      const response = await app.request(`/tickets/${firstTicket.id}`);

      expect(response.status).toBe(401);
    });

    it("should return 404 for invalid route", async () => {
      const response = await app.request("/tickets/", {
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should return ticket with correct schema structure", async () => {
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const firstTicket = tickets[0];

      const response = await app.request(`/tickets/${firstTicket.id}`, {
        headers,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("organizationId");
      expect(data).toHaveProperty("subject");
      expect(data).toHaveProperty("description");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("priority");
      expect(data).toHaveProperty("customerId");
      expect(data).toHaveProperty("assigneeId");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
      expect(data).toHaveProperty("closedAt");

      expect(typeof data.id).toBe("string");
      expect(typeof data.subject).toBe("string");
      expect(typeof data.description).toBe("string");
    });
  });

  describe("DELETE /tickets/{id}", () => {
    it("should successfully delete an existing ticket", async () => {
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const ticketToDelete = tickets[0];

      const deleteResponse = await app.request(
        `/tickets/${ticketToDelete.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);
      expect(deleteData.message).toBe("Ticket deleted successfully");

      // Verify ticket is actually deleted
      const getResponse = await app.request(`/tickets/${ticketToDelete.id}`, {
        headers,
      });
      expect(getResponse.status).toBe(404);

      // Verify remaining tickets count
      const newListResponse = await app.request("/tickets", {
        headers,
      });
      const remainingTickets = await newListResponse.json();
      expect(remainingTickets.length).toBe(tickets.length - 1);
    });

    it("should return 404 for non-existent ticket", async () => {
      const response = await app.request("/tickets/non-existent-id", {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should enforce organization isolation", async () => {
      const response = await app.request("/tickets/other-org-ticket-id", {
        method: "DELETE",
        headers,
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const firstTicket = tickets[0];

      const response = await app.request(`/tickets/${firstTicket.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("should return correct response schema", async () => {
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const ticketToDelete = tickets[1]; // Use second ticket to avoid conflicts

      const deleteResponse = await app.request(
        `/tickets/${ticketToDelete.id}`,
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
      const listResponse = await app.request("/tickets", {
        headers,
      });
      const tickets = await listResponse.json();
      const firstTicket = tickets[0];

      const response = await app.request(`/tickets/${firstTicket.id}`, {
        method: "PATCH", // Invalid method for this endpoint
        headers,
      });

      expect(response.status).toBe(404);
    });
  });
});
