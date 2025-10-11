import { OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller, createTRPCContext } from "@repo/trpc";
import {
  customerCreateRoute,
  customerDeleteRoute,
  customerGetRoute,
  customerListRoute,
  customerUpdateRoute,
} from "./routes/customers";

const customers = new OpenAPIHono();

customers.openapi(customerListRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const query = c.req.valid("query");
  const data = await caller.customers.list(query);
  return c.json(data);
});

customers.openapi(customerGetRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const param = c.req.valid("param");
  const data = await caller.customers.get(param);
  return c.json(data);
});

customers.openapi(customerCreateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const data = c.req.valid("json");
  const result = await caller.customers.create(data);
  return c.json(result, 201);
});

customers.openapi(customerUpdateRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const param = c.req.valid("param");
  const body = c.req.valid("json");
  const result = await caller.customers.update({ ...param, ...body });
  return c.json(result);
});

customers.openapi(customerDeleteRoute, async (c) => {
  const context = createTRPCContext({ headers: c.req.raw.headers });
  const caller = createTrpcCaller(context);
  const param = c.req.valid("param");
  const data = await caller.customers.delete(param);
  return c.json(data);
});

export { customers };