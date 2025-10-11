import { createRoute } from "@hono/zod-openapi";
import {
  PriorityListInput,
  PriorityCreateInput,
  PriorityGetInput,
  PriorityUpdateInput,
  PriorityDeleteOutput,
  Priority,
} from "@repo/validators";

const sharedConfig = {
  security: [
    {
      ApiKey: [],
    },
  ],
  tags: ["priorities"],
};

export const priorityListRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "List Priorities",
  summary: "List priorities",
  operationId: "listPriorities",
  path: "/",
  request: {
    query: PriorityListInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Priority.array(),
        },
      },
      description: "Retrieve the priorities",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

export const priorityCreateRoute = createRoute({
  ...sharedConfig,
  method: "post",
  title: "Create Priority",
  summary: "Create a priority",
  operationId: "createPriority",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: PriorityCreateInput,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: Priority,
        },
      },
      description: "Priority created successfully",
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

export const priorityGetRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "Get Priority",
  summary: "Get a priority by ID",
  operationId: "getPriority",
  path: "/{id}",
  request: {
    params: PriorityGetInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Priority,
        },
      },
      description: "Priority retrieved successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Priority not found",
    },
  },
});

export const priorityUpdateRoute = createRoute({
  ...sharedConfig,
  method: "patch",
  title: "Update Priority",
  summary: "Update a priority",
  operationId: "updatePriority",
  path: "/{id}",
  request: {
    params: PriorityGetInput,
    body: {
      content: {
        "application/json": {
          schema: PriorityUpdateInput.shape.values,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Priority,
        },
      },
      description: "Priority updated successfully",
    },
    400: {
      description: "Bad Request - Invalid input",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Priority not found",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

export const priorityDeleteRoute = createRoute({
  ...sharedConfig,
  method: "delete",
  title: "Delete Priority",
  summary: "Delete a priority",
  operationId: "deletePriority",
  path: "/{id}",
  request: {
    params: PriorityGetInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PriorityDeleteOutput,
        },
      },
      description: "Priority deleted successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Priority not found",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});