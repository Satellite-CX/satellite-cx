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
});
