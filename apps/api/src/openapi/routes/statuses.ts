import { createRoute } from "@hono/zod-openapi";
import {
  StatusListRequest,
  StatusCreateRequest,
  StatusGetRequest,
  StatusUpdateInput,
  StatusDeleteRequest,
  StatusDeleteResponse,
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
  summary: "Create a status",
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

export const statusGetRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "Get Status",
  summary: "Get a status by ID",
  operationId: "getStatus",
  path: "/{id}",
  request: {
    params: StatusGetRequest,
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
    params: StatusGetRequest,
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
    params: StatusDeleteRequest,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusDeleteResponse,
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
