import { z } from "@hono/zod-openapi";

export const TicketDelete = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "123",
    description: "The ID of the ticket to delete",
  }),
});

export const TicketDeleteResponse = z.object({
  success: z.boolean().openapi({
    description: "Whether the deletion was successful",
    example: true,
  }),
  message: z.string().openapi({
    description: "Success message",
    example: "Ticket deleted successfully",
  }),
});