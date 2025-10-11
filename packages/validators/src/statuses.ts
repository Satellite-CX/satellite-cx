import { z as zOpenApi } from "@hono/zod-openapi";
import { statuses } from "@repo/db/schema";
import { createInsertSchema, createSelectSchema } from "./schema-factory";
import { limit, limitOpenApi, offset, offsetOpenApi } from "./shared";

export const Status = createSelectSchema(statuses);

export const StatusCreateInput = createInsertSchema(statuses, {
  name: (name) =>
    name.min(1).max(100).openapi({
      example: "Open",
      description: "The name of the status",
    }),
  icon: (icon) =>
    icon.optional().openapi({
      example: "🔍",
      description: "Icon for the status",
    }),
  color: (color) =>
    color.optional().openapi({
      example: "#3b82f6",
      description: "Color for the status in hex format",
    }),
}).omit({
  organizationId: true,
});

export const StatusGetInput = zOpenApi.object({
  id: zOpenApi.string().openapi({
    example: "123",
    description: "The ID of the status",
  }),
});

export const StatusListQuery = zOpenApi
  .object({
    limit,
    offset,
  })
  .optional();

export const StatusListInput = zOpenApi.object({
  limit: limitOpenApi.openapi({
    example: 20,
    description: "Limit the number of statuses returned",
  }),
  offset: offsetOpenApi.openapi({
    example: 0,
    description: "Skip the first N statuses",
  }),
});

export const StatusUpdateInput = zOpenApi.object({
  id: StatusGetInput.shape.id,
  values: StatusCreateInput.partial(),
});

export const StatusDeleteOutput = zOpenApi.object({
  success: zOpenApi.boolean().openapi({
    example: true,
    description: "Whether the status was successfully deleted",
  }),
});
