import { z } from "@hono/zod-openapi";
import { createInsertSchema } from "../schema-factory";
import { customers } from "@repo/db/schema";

export const CustomerUpdateInput = createInsertSchema(customers)
  .omit({
    organizationId: true,
    id: true,
  })
  .partial();

export const CustomerUpdateParams = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "123",
    description: "The ID of the customer to update",
  }),
});