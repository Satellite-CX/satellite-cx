import { tickets } from "@repo/db/schema";
import { ticketGetSchema, ticketListQueryTrpcInput } from "@repo/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const ticketsRouter = router({
  get: protectedProcedure
    .input(ticketGetSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const ticket = await ctx.db.rls((tx) =>
        tx.query.tickets.findFirst({ where: eq(tickets.id, id) })
      );
      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }
      return ticket;
    }),
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
