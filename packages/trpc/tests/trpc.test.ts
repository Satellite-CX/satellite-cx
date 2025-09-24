import { createDrizzleClient } from "@repo/db";
import { resetDatabase, seedDatabase } from "@repo/db/utils";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createTrpcCaller, TRPCCaller } from "../src";
import { generateTestData } from "./generate-test-data";

describe("Session Management", () => {
  let caller: TRPCCaller;
  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    await seedDatabase();
    testData = await generateTestData();
    const db = await createDrizzleClient({
      organizationId: testData.organization.id,
      role: testData.member.role,
      userId: testData.user.id,
    });
    const headers = new Headers({
      "x-api-key": testData.apiKey,
    });

    caller = createTrpcCaller({
      db,
      headers,
    });
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("should throw when calling a protected route without an api key", async () => {
    const db = await createDrizzleClient();
    const headers = new Headers();
    const caller = createTrpcCaller({
      db,
      headers,
    });
    expect(caller.session()).rejects.toThrow("Unauthorized");
  });

  it("should return a session when calling a protected route with an api key", async () => {
    const session = await caller.session();
    expect(session).toBeDefined();
    expect(session.user.id).toBe(testData.user.id);
  });
});
