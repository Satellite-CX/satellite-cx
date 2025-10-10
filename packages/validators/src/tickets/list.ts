import { z as zOpenApi } from "@hono/zod-openapi";
import { z } from "zod";
import { Ticket } from "./schema";
import { limit, limitOpenApi, offset, offsetOpenApi } from "../shared";

const orderByFields = [
  "createdAt",
  "updatedAt",
  "closedAt",
  "subject",
  "description",
] as const;

export const TicketWithRelations = z.object({
  status: z.literal(true).optional(),
  priority: z.literal(true).optional(),
  customerId: z.literal(true).optional(),
  assigneeId: z.literal(true).optional(),
});

export const TicketOrderBy = z.object({
  field: z.enum(orderByFields),
  direction: z.enum(["asc", "desc"]),
});

export const TicketListQuery = z
  .strictObject({
    limit,
    offset,
    orderBy: TicketOrderBy.optional(),
    with: TicketWithRelations.optional(),
  })
  .optional();

export const TicketListRequest = zOpenApi.strictObject({
  limit: limitOpenApi.openapi({
    example: 10,
    description: "Limit the number of tickets returned",
  }),
  offset: offsetOpenApi.openapi({
    example: 10,
    description: "Skip the first N tickets",
  }),
  orderBy: zOpenApi
    .string()
    .transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error("Invalid JSON format for orderBy");
      }
    })
    .pipe(TicketOrderBy)
    .optional(),
  with: zOpenApi
    .string()
    .transform((val) => {
      const fields = val.split(",").map((r) => r.trim());
      return Object.fromEntries(fields.map((field) => [field, true]));
    })
    .pipe(TicketWithRelations)
    .optional(),
});

export const TicketList = Ticket.array();
