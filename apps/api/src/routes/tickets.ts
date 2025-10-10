import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller } from "@repo/trpc";
import { ticketListRequestQuery, ticketListSchema } from "@repo/validators";

const tickets = new OpenAPIHono();

tickets.openapi(
  createRoute({
    method: "get",
    title: "List Tickets",
    summary: "Get all tickets",
    operationId: "listTickets",
    path: "/",
    tags: ["tickets"],
    request: {
      params: ticketListRequestQuery,
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
    const query = c.req.query();
    const data = await caller.tickets.list(query);
    return c.json(data);
  }
);

export { tickets };
