import { createRoute } from "@hono/zod-openapi";
import {
  Ticket,
  TicketCreateInput,
  TicketDeleteInput,
  TicketDeleteOutput,
  TicketGetInput,
  TicketList,
  TicketListInput,
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
  summary: "List tickets",
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
    query: TicketListInput,
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
    params: TicketGetInput,
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
  summary: "Create a ticket",
  operationId: "createTicket",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TicketCreateInput,
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
    params: TicketDeleteInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TicketDeleteOutput,
        },
      },
      description: "Ticket deleted successfully",
    },
    404: {
      description: "Ticket not found",
    },
  },
});
