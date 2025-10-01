import { tickets } from "@repo/db/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const columns = getTableColumns(tickets);
const columnsKeys = Object.keys(columns) as (keyof typeof columns)[];

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
  })
  .optional();

export const ticketsRouter = router({
  list: protectedProcedure
    .input(ticketsListQuery)
    .query(async ({ ctx, input }) => {
      const { limit, offset, orderBy } = input ?? {};
      return await ctx.db.rls((tx) =>
        tx.query.tickets.findMany({
          where: eq(tickets.organizationId, ctx.session.activeOrganizationId),
          limit,
          offset,
          orderBy: (tickets, { asc, desc }) => {
            if (!orderBy) {
              return [desc(tickets.createdAt)];
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
