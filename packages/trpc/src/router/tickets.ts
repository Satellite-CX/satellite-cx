import { protectedProcedure, router } from "../trpc";
import { eq } from "drizzle-orm";
import { tickets } from "@repo/db/schema";

export const ticketsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.rls((tx) =>
      tx.query.tickets.findMany({
        where: eq(tickets.id, "sdf"),
      })
    );
  }),
});
