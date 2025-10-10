import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createTrpcCaller } from "@repo/trpc";
import { StatusListRequest, Status } from "@repo/validators";

const statuses = new OpenAPIHono();

statuses.openapi(
  createRoute({
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
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const query = c.req.valid("query");
    const data = await caller.statuses.list(query);
    return c.json(data);
  }
);

export { statuses };
