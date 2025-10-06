// import { zValidator } from "@hono/zod-validator";
import { validator as zValidator, resolver, describeRoute } from "hono-openapi";

import { createTrpcCaller } from "@repo/trpc";
import {
  ticketListRequestQuery,
  ticketListResponseSchema,
} from "@repo/validators";
import { Hono } from "hono";

const tickets = new Hono();

tickets.get(
  "/",
  describeRoute({
    responses: {
      200: {
        description: "List of tickets",
        content: {
          "application/json": {
            schema: resolver(ticketListResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", ticketListRequestQuery),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const query = c.req.valid("query");
    const data = await caller.tickets.list(query);
    return c.json(data);
  }
);

export { tickets };
