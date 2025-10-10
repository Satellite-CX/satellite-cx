import { createRoute } from "@hono/zod-openapi";
import {
  StatusListRequest,
  StatusCreateRequest,
  Status,
} from "@repo/validators";

const sharedConfig = {
  security: [
    {
      ApiKey: [],
    },
  ],
  tags: ["statuses"],
};

export const statusListRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "List Statuses",
  summary: "List statuses",
  operationId: "listStatuses",
  path: "/",
  request: {
    query: StatusListRequest,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Status.array(),
        },
      },
      description: "Retrieve the statuses",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

export const statusCreateRoute = createRoute({
  ...sharedConfig,
  method: "post",
  title: "Create Status",
  summary: "Create a new status",
  operationId: "createStatus",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StatusCreateRequest,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: Status,
        },
      },
      description: "Status created successfully",
    },
    400: {
      description: "Bad Request - Invalid input",
    },
    401: {
      description: "Unauthorized",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});
