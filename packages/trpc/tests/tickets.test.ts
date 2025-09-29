import { resetDatabase, seedDatabase } from "@repo/db/utils";
import { afterAll, beforeAll, describe, it } from "bun:test";
import { createTrpcCaller } from "../src";
import { generateTestData } from "./generate-test-data";

describe("Tickets", () => {
  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    await seedDatabase();
    testData = await generateTestData();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("should return a list of tickets", async () => {
    const headers = new Headers({
      "x-api-key": testData.apiKey,
    });
    const caller = createTrpcCaller({
      headers,
    });
    const tickets = await caller.tickets.list();
    console.log(tickets);
  });
});
