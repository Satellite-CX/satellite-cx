import { z as zOpenApi } from "@hono/zod-openapi";

export const StatusCreateRequest = zOpenApi.object({
  name: zOpenApi.string().min(1).max(100).openapi({
    example: "Open",
    description: "The name of the status",
  }),
  icon: zOpenApi.string().optional().openapi({
    example: "🔍",
    description: "Icon for the status",
  }),
  color: zOpenApi.string().optional().openapi({
    example: "#3b82f6",
    description: "Color for the status in hex format",
  }),
});
