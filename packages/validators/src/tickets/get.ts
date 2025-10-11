import { z } from "@hono/zod-openapi";

export const TicketGetInput = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "123",
    description: "The ID of the ticket",
  }),
});
