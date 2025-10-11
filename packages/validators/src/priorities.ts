import { priorities } from "@repo/db/schema";
import { createInsertSchema, createSelectSchema } from "./schema-factory";
import { z as zOpenApi } from "@hono/zod-openapi";
import { limit, limitOpenApi, offset, offsetOpenApi } from "./shared";

export const Priority = createSelectSchema(priorities);
export const PriorityList = Priority.array();

export const PriorityCreateInput = createInsertSchema(priorities, {
  name: (name) =>
    name.min(1).max(100).openapi({
      example: "Open",
      description: "The name of the priority",
    }),
  icon: (icon) =>
    icon.optional().openapi({
      example: "🔍",
      description: "Icon for the priority",
    }),
  color: (color) =>
    color.optional().openapi({
      example: "#3b82f6",
      description: "Color for the priority in hex format",
    }),
}).omit({
  organizationId: true,
});

export const PriorityGetInput = zOpenApi.object({
  id: zOpenApi.string().openapi({
    example: "123",
    description: "The ID of the priority",
  }),
});

export const PriorityListTrpcInput = zOpenApi
  .object({
    limit,
    offset,
  })
  .optional();

export const PriorityListInput = zOpenApi.object({
  limit: limitOpenApi.openapi({
    example: 20,
    description: "Limit the number of priorities returned",
  }),
  offset: offsetOpenApi.openapi({
    example: 0,
    description: "Skip the first N priorities",
  }),
});

export const PriorityUpdateInput = zOpenApi.object({
  id: PriorityGetInput.shape.id,
  values: PriorityCreateInput.partial(),
});

export const PriorityDeleteOutput = zOpenApi.object({
  success: zOpenApi.boolean().openapi({
    example: true,
    description: "Whether the priority was successfully deleted",
  }),
});
