import { z } from "@hono/zod-openapi";

export const TicketDeleteInput = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "123",
    description: "The ID of the ticket to delete",
  }),
});

export const TicketDeleteOutput = z.object({
  success: z.boolean().openapi({
    example: true,
    description: "Whether the deletion was successful",
  }),
  message: z.string().openapi({
    example: "Ticket deleted successfully",
    description: "Success message",
  }),
});
