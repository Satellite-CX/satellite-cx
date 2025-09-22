import { describe, it, expect, beforeAll } from "bun:test";
import { createDrizzleClient } from "@repo/db";
import { createTrpcCaller, TRPCCaller } from "../src";

describe("Basic TRPC", () => {
  let caller: TRPCCaller;

  beforeAll(async () => {
    const db = await createDrizzleClient();
    caller = createTrpcCaller({
      db,
      session: null,
    });
  });

  it("should return a health check", async () => {
    const health = await caller.health();
    expect(health.status).toBe("ok");
  });
});
