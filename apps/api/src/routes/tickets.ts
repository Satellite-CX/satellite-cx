import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller } from "@repo/trpc";
import {
  ticketGetSchema,
  ticketListRequestQuery,
  ticketListSchema,
  ticketSchema,
} from "@repo/validators";

const tickets = new OpenAPIHono();

tickets.openapi(
  createRoute({
    method: "get",
    title: "List Tickets",
    summary: "Get many tickets",
    operationId: "listTickets",
    path: "/",
    tags: ["tickets"],
    "x-codeSamples": [
      {
        lang: "js",
        label: "JavaScript SDK",
        source: "console.log('hello world')",
      },
    ],
    request: {
      query: ticketListRequestQuery,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ticketListSchema,
          },
        },
        description: "Retrieve the tickets",
      },
    },
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const query = c.req.valid("query");
    const data = await caller.tickets.list(query);
    return c.json(data);
  }
);

tickets.openapi(
  createRoute({
    method: "get",
    title: "Get Ticket",
    summary: "Get a ticket",
    operationId: "getTicket",
    path: "/{id}",
    tags: ["tickets"],
    request: {
      params: ticketGetSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ticketSchema,
          },
        },
        description: "Retrieve a single ticket",
      },
    },
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const data = await caller.tickets.get(c.req.param());
    return c.json(data);
  }
);

export { tickets };
