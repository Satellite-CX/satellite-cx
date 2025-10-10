import { OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller, createTRPCContext } from "@repo/trpc";
import {
  ticketCreateRoute,
  ticketDeleteRoute,
  ticketGetRoute,
  ticketListRoute,
} from "./routes/tickets";

const tickets = new OpenAPIHono();

tickets.openapi(ticketListRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const query = c.req.valid("query");
  const data = await caller.tickets.list(query);
  return c.json(data);
});

tickets.openapi(ticketGetRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const param = c.req.valid("param");
  const data = await caller.tickets.get(param);
  return c.json(data);
});

tickets.openapi(ticketCreateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const data = await c.req.json();
  const result = await caller.tickets.create(data);
  return c.json(result, 201);
});

tickets.openapi(ticketDeleteRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const param = c.req.valid("param");
  const data = await caller.tickets.delete(param);
  return c.json(data);
});

export { tickets };
