import { z } from "@hono/zod-openapi";

export const CustomerDeleteOutput = z.object({
  success: z.boolean().openapi({
    example: true,
    description: "Whether the deletion was successful",
  }),
  message: z.string().openapi({
    example: "Customer deleted successfully",
    description: "Success message",
  }),
});
