import { auth } from "@repo/auth";
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

    const headers = new Headers({
      cookie: `scx.session_token=${testData.token}`,
      // "x-api-key": testData.apiKey,
    });

    caller = createTrpcCaller({
      headers,
    });
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("should throw when calling a protected route without authentication", async () => {
    const headers = new Headers();
    const caller = createTrpcCaller({
      headers,
    });
    expect(caller.session()).rejects.toThrow("Unauthorized");
  });

  it("should set active organization in session", async () => {
    const { token } = testData;
    const data = await auth.api.setActiveOrganization({
      body: {
        organizationId: testData.organization.id,
        organizationSlug: testData.organization.slug!,
      },
      headers: new Headers({
        cookie: `scx.session_token=${token}`,
      }),
    });
    expect(data).toBeDefined();
    expect(data!.id).toBe(testData.organization.id);
    expect(data!.slug).toBe(testData.organization.slug!);
  });

  it("should return a session when calling a protected route", async () => {
    const session = await caller.session();
    expect(session).toBeDefined();
    expect(session.user.id).toBe(testData.user.id);
  });
});
