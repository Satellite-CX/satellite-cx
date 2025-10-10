import { statuses } from "@repo/db/schema";
import { StatusListQuery, Status } from "@repo/validators";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const statusesRouter = router({
  list: protectedProcedure
    .input(StatusListQuery)
    .output(Status.array())
    .query(async ({ ctx, input }) => {
      const { limit, offset } = input ?? {};
      const { activeOrganizationId } = ctx.session;
      return await ctx.db.rls((tx) =>
        tx.query.statuses.findMany({
          where: eq(statuses.organizationId, activeOrganizationId),
          limit,
          offset,
          orderBy: (statusesTable, { asc }) => [asc(statusesTable.name)],
        })
      );
    }),
});
