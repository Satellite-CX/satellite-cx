import { tickets } from "@repo/db/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const columns = getTableColumns(tickets);
const columnsKeys = Object.keys(columns) as (keyof typeof columns)[];

const withSchema = z.object({
  status: z.literal(true).optional(),
  priority: z.literal(true).optional(),
  customerId: z.literal(true).optional(),
  assigneeId: z.literal(true).optional(),
});

export const ticketsListQuery = z
  .object({
    limit: z.number().optional(),
    offset: z.number().optional(),
    orderBy: z
      .object({
        field: z.enum(columnsKeys),
        direction: z.enum(["asc", "desc"]),
      })
      .optional(),
    with: withSchema.optional(),
  })
  .optional();

export const ticketsRouter = router({
  list: protectedProcedure
    .input(ticketsListQuery)
    .query(async ({ ctx, input }) => {
      const { limit, offset, orderBy, with: withParams } = input ?? {};

      return await ctx.db.rls((tx) =>
        tx.query.tickets.findMany({
          where: eq(tickets.organizationId, ctx.session.activeOrganizationId),
          limit,
          offset,
          with: withParams,
          orderBy: (ticketsTable, { asc, desc }) => {
            if (!orderBy) {
              return [desc(ticketsTable.createdAt)];
            }
            const { field, direction } = orderBy;
            const orderFn = direction === "asc" ? asc : desc;
            const column = columns[field];
            return [orderFn(column)];
          },
        })
      );
    }),
});
