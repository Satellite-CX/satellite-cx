import { OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller, createTRPCContext } from "@repo/trpc";
import { priorityListRoute, priorityCreateRoute, priorityGetRoute, priorityUpdateRoute, priorityDeleteRoute } from "./routes/priorities";

const priorities = new OpenAPIHono();

priorities.openapi(priorityCreateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const data = c.req.valid("json");
  const result = await caller.priorities.create(data);
  return c.json(result, 201);
});

priorities.openapi(priorityListRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const query = c.req.valid("query");
  const data = await caller.priorities.list(query);
  return c.json(data);
});

priorities.openapi(priorityGetRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const params = c.req.valid("param");
  const data = await caller.priorities.get(params);
  return c.json(data);
});

priorities.openapi(priorityUpdateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const params = c.req.valid("param");
  const body = c.req.valid("json");
  const data = await caller.priorities.update({ id: params.id, values: body });
  return c.json(data);
});

priorities.openapi(priorityDeleteRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const params = c.req.valid("param");
  const data = await caller.priorities.delete(params);
  return c.json(data);
});

export { priorities };