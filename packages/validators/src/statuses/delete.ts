import { z as zOpenApi } from "@hono/zod-openapi";
import { StatusGetRequest } from "./create";

export const StatusDeleteRequest = StatusGetRequest;

export const StatusDeleteResponse = zOpenApi.object({
  success: zOpenApi.boolean().openapi({
    example: true,
    description: "Whether the status was successfully deleted",
  }),
});