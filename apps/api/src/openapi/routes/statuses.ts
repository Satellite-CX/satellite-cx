import { createRoute } from "@hono/zod-openapi";
import {
  StatusListInput,
  StatusCreateInput,
  StatusGetInput,
  StatusUpdateInput,
  StatusDeleteOutput,
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
    query: StatusListInput,
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
  summary: "Create a status",
  operationId: "createStatus",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StatusCreateInput,
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

export const statusGetRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "Get Status",
  summary: "Get a status by ID",
  operationId: "getStatus",
  path: "/{id}",
  request: {
    params: StatusGetInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Status,
        },
      },
      description: "Status retrieved successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Status not found",
    },
  },
});

export const statusUpdateRoute = createRoute({
  ...sharedConfig,
  method: "patch",
  title: "Update Status",
  summary: "Update a status",
  operationId: "updateStatus",
  path: "/{id}",
  request: {
    params: StatusGetInput,
    body: {
      content: {
        "application/json": {
          schema: StatusUpdateInput.shape.values,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Status,
        },
      },
      description: "Status updated successfully",
    },
    400: {
      description: "Bad Request - Invalid input",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Status not found",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

export const statusDeleteRoute = createRoute({
  ...sharedConfig,
  method: "delete",
  title: "Delete Status",
  summary: "Delete a status",
  operationId: "deleteStatus",
  path: "/{id}",
  request: {
    params: StatusGetInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusDeleteOutput,
        },
      },
      description: "Status deleted successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Status not found",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});
