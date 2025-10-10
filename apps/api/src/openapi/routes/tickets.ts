import { createRoute } from "@hono/zod-openapi";
import {
  Ticket,
  TicketCreate,
  TicketDelete,
  TicketDeleteResponse,
  TicketGet,
  TicketList,
  TicketListRequest,
} from "@repo/validators";

const sharedConfig = {
  security: [
    {
      ApiKey: [],
    },
  ],
  tags: ["tickets"],
};

export const ticketListRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "List Tickets",
  summary: "Get many tickets",
  operationId: "listTickets",
  path: "/",
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
});

export const ticketGetRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "Get Ticket",
  summary: "Get a ticket",
  operationId: "getTicket",
  path: "/{id}",
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
});

export const ticketCreateRoute = createRoute({
  ...sharedConfig,
  method: "post",
  title: "Create Ticket",
  summary: "Create a new ticket",
  operationId: "createTicket",
  path: "/",
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
});

export const ticketDeleteRoute = createRoute({
  ...sharedConfig,
  method: "delete",
  title: "Delete Ticket",
  summary: "Delete a ticket",
  operationId: "deleteTicket",
  path: "/{id}",
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
});
