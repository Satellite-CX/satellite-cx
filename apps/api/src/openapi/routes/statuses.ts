import { createRoute } from "@hono/zod-openapi";
import { StatusListRequest } from "@repo/validators";
import { Status } from "@repo/validators";

export const statusListRoute = createRoute({
  method: "get",
  title: "List Statuses",
  summary: "Get many statuses",
  operationId: "listStatuses",
  path: "/",
  tags: ["statuses"],
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
