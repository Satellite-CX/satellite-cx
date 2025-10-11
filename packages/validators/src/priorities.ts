import { priorities } from "@repo/db/schema";
import { createInsertSchema } from "./schema-factory";
import { z as zOpenApi } from "@hono/zod-openapi";

export const PriorityGetInput = zOpenApi.object({
  id: zOpenApi.string().openapi({
    example: "123",
    description: "The ID of the priority",
  }),
});

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

export const PriorityUpdateInput = zOpenApi.object({
  id: PriorityGetInput.shape.id,
  values: PriorityCreateInput.partial(),
});
