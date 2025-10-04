import { tickets } from "@repo/db/schema";
import { ticketListQueryTrpcInput } from "@repo/validators";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const ticketsRouter = router({
  list: protectedProcedure
    .input(ticketListQueryTrpcInput)
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

            return [orderFn(ticketsTable[field])];
          },
        })
      );
    }),
});
