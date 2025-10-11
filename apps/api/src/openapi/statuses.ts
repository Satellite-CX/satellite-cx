import { OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller, createTRPCContext } from "@repo/trpc";
import { statusListRoute, statusCreateRoute, statusGetRoute, statusUpdateRoute } from "./routes/statuses";

const statuses = new OpenAPIHono();

statuses.openapi(statusCreateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const data = c.req.valid("json");
  const result = await caller.statuses.create(data);
  return c.json(result, 201);
});

statuses.openapi(statusListRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const query = c.req.valid("query");
  const data = await caller.statuses.list(query);
  return c.json(data);
});

statuses.openapi(statusGetRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const params = c.req.valid("param");
  const data = await caller.statuses.get(params);
  return c.json(data);
});

statuses.openapi(statusUpdateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const params = c.req.valid("param");
  const body = c.req.valid("json");
  const data = await caller.statuses.update({ id: params.id, values: body });
  return c.json(data);
});

export { statuses };
