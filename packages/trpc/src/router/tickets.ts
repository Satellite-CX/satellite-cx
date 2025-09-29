import { tickets } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const ticketsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.rls((tx) =>
      tx.query.tickets.findMany({
        where: eq(tickets.organizationId, ctx.session.activeOrganizationId),
      })
    );
  }),
});
