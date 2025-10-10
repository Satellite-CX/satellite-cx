import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller } from "@repo/trpc";
import {
  TicketGet,
  TicketListRequest,
  TicketList,
  Ticket,
  TicketDelete,
  TicketDeleteResponse,
  TicketCreate,
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
      query: TicketListRequest,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: TicketList,
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
      params: TicketGet,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: Ticket,
          },
        },
        description: "Retrieve a single ticket",
      },
    },
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const param = c.req.valid("param");
    const data = await caller.tickets.get(param);
    return c.json(data);
  }
);

tickets.openapi(
  createRoute({
    method: "post",
    title: "Create Ticket",
    summary: "Create a new ticket",
    operationId: "createTicket",
    path: "/",
    tags: ["tickets"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: TicketCreate,
          },
        },
        description: "Ticket data to create",
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: Ticket,
          },
        },
        description: "Ticket created successfully",
      },
      400: {
        description: "Invalid request data",
      },
      401: {
        description: "Unauthorized",
      },
    },
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const data = await c.req.json();
    const result = await caller.tickets.create(data);
    return c.json(result, 201);
  }
);

tickets.openapi(
  createRoute({
    method: "delete",
    title: "Delete Ticket",
    summary: "Delete a ticket",
    operationId: "deleteTicket",
    path: "/{id}",
    tags: ["tickets"],
    request: {
      params: TicketDelete,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: TicketDeleteResponse,
          },
        },
        description: "Ticket deleted successfully",
      },
      404: {
        description: "Ticket not found",
      },
    },
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const param = c.req.valid("param");
    const data = await caller.tickets.delete(param);
    return c.json(data);
  }
);

export { tickets };
