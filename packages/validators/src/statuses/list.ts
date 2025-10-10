import { z as zOpenApi } from "@hono/zod-openapi";
import { z } from "zod";
import { limit, limitOpenApi, offset, offsetOpenApi } from "../shared";

export const StatusListQuery = z
  .object({
    limit,
    offset,
  })
  .optional();

export const StatusListRequest = zOpenApi.object({
  limit: limitOpenApi.openapi({
    example: 20,
    description: "Limit the number of statuses returned",
  }),
  offset: offsetOpenApi.openapi({
    example: 0,
    description: "Skip the first N statuses",
  }),
});
