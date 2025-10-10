import { z } from "zod";
import { z as zOpenApi } from "@hono/zod-openapi";
import { createSchemaFactory } from "drizzle-zod";
import { tickets } from "@repo/db/schema";

const orderByFields = [
  "createdAt",
  "updatedAt",
  "closedAt",
  "subject",
  "description",
] as const;

export const ticketWithRelations = z.object({
  status: z.literal(true).optional(),
  priority: z.literal(true).optional(),
  customerId: z.literal(true).optional(),
  assigneeId: z.literal(true).optional(),
});

export const ticketOrderBy = z.object({
  field: z.enum(orderByFields),
  direction: z.enum(["asc", "desc"]),
});

export const ticketListQueryTrpcInput = z
  .strictObject({
    limit: z.number().optional(),
    offset: z.number().optional(),
    orderBy: ticketOrderBy.optional(),
    with: ticketWithRelations.optional(),
  })
  .optional();

export const ticketListRequestQuery = zOpenApi.strictObject({
  limit: zOpenApi.coerce.number().optional().openapi({
    example: 10,
    description: "Limit the number of tickets returned",
  }),
  offset: zOpenApi.coerce.number().optional().openapi({
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
    .pipe(ticketOrderBy)
    .optional(),
  with: zOpenApi
    .string()
    .transform((val) => {
      const fields = val.split(",").map((r) => r.trim());
      return Object.fromEntries(fields.map((field) => [field, true]));
    })
    .pipe(ticketWithRelations)
    .optional(),
});

const { createSelectSchema } = createSchemaFactory({ zodInstance: zOpenApi });

const ticketSchema = createSelectSchema(tickets);

export const ticketListSchema = zOpenApi.array(ticketSchema);
