import { z } from "zod";

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

export const ticketListRequestQuery = z
  .strictObject({
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
    orderBy: z
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
    with: z
      .string()
      .transform((val) => {
        const fields = val.split(",").map((r) => r.trim());
        return Object.fromEntries(fields.map((field) => [field, true]));
      })
      .pipe(ticketWithRelations)
      .optional(),
  })
  .describe("Query parameters for listing tickets");

export const ticketListResponseSchema = z
  .array(
    z.object({
      foo: z.string(),
      bar: z.number(),
    })
  )
  .describe("List of tickets");
