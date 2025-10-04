import { auth } from "@repo/db/auth";
import {
  resetDatabase,
  seedDatabase,
  generateTestData,
} from "@repo/db/test-utils";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  setSystemTime,
} from "bun:test";
import { createTrpcCaller } from "../src";
import { adminDB } from "@repo/db/client";
import { apikeys } from "@repo/db/schema";
import { eq } from "drizzle-orm";

const EIGHT_DAYS = 8 * 24 * 60 * 60 * 1000;

describe("Authentication Management", () => {
  let testData: Awaited<ReturnType<typeof generateTestData>>;

  beforeAll(async () => {
    testData = await generateTestData();
    await seedDatabase(testData);
  });

  afterEach(() => {
    setSystemTime();
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
    const headers = new Headers({
      cookie: `scx.session_token=${testData.token}`,
    });

    const caller = createTrpcCaller({
      headers,
    });

    const session = await caller.session();

    expect(session).toBeDefined();
    expect(session.user.id).toBe(testData.user.id);
    expect(session.activeOrganizationId).toBe(testData.organization.id);
  });

  describe("API Key Authentication", () => {
    it("should get session using api key", async () => {
      const headers = new Headers({
        "x-api-key": testData.apiKey.key,
      });

      const caller = createTrpcCaller({
        headers,
      });

      const session = await caller.session();
      expect(session).toBeDefined();
      expect(session.user.id).toBe(testData.user.id);
      expect(session.activeOrganizationId).toBe(testData.organization.id);
    });

    it("should throw when calling a protected route with an invalid api key", async () => {
      const headers = new Headers({
        "x-api-key": "invalid",
      });

      const caller = createTrpcCaller({
        headers,
      });

      expect(caller.session()).rejects.toThrow("Invalid API key.");
    });

    it("should throw when calling a protected route with an expired api key", async () => {
      const futureDate = new Date(Date.now() + EIGHT_DAYS);
      setSystemTime(futureDate);

      const headers = new Headers({
        "x-api-key": testData.apiKey.key,
      });

      const caller = createTrpcCaller({
        headers,
      });

      expect(caller.session()).rejects.toThrow("API Key has expired");
    });

    it("should throw when calling a protected route with an disabled api key", async () => {
      await adminDB
        .update(apikeys)
        .set({ enabled: false })
        .where(eq(apikeys.id, testData.apiKey.id))
        .returning();

      const headers = new Headers({
        "x-api-key": testData.apiKey.key,
      });

      const caller = createTrpcCaller({
        headers,
      });

      expect(caller.session()).rejects.toThrow("Invalid API key.");
      await adminDB
        .update(apikeys)
        .set({ enabled: true })
        .where(eq(apikeys.id, testData.apiKey.id));
    });
  });
});
