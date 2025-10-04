import { zValidator } from "@hono/zod-validator";
import { createTrpcCaller } from "@repo/trpc";
import { ticketListRequestQuery } from "@repo/validators";
import { Hono } from "hono";

const tickets = new Hono();

tickets.get("/", zValidator("query", ticketListRequestQuery), async (c) => {
  const caller = createTrpcCaller({ headers: c.req.raw.headers });
  const query = c.req.valid("query");
  const data = await caller.tickets.list(query);
  return c.json(data);
});

export { tickets };
