import { statuses } from "@repo/db/schema";
import { StatusListQuery, Status, StatusCreateRequest } from "@repo/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const statusesRouter = router({
  create: protectedProcedure
    .input(StatusCreateRequest)
    .output(Status)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganizationId } = ctx.session;

      const result = await ctx.db.rls((tx) =>
        tx
          .insert(statuses)
          .values({ ...input, organizationId: activeOrganizationId })
          .returning()
      );

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create status",
        });
      }

      return result[0]!;
    }),
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
