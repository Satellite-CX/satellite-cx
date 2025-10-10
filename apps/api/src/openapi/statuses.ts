import { OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller } from "@repo/trpc";
import { statusListRoute } from "./routes/statuses";

const statuses = new OpenAPIHono();

statuses.openapi(statusListRoute, async (c) => {
  const caller = createTrpcCaller({ headers: c.req.raw.headers });
  const query = c.req.valid("query");
  const data = await caller.statuses.list(query);
  return c.json(data);
});

export { statuses };
