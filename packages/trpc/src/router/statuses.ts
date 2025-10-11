import { statuses } from "@repo/db/schema";
import {
  StatusListQuery,
  Status,
  StatusCreateInput,
  StatusUpdateInput,
  StatusGetInput,
  StatusDeleteOutput,
} from "@repo/validators";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const statusesRouter = router({
  get: protectedProcedure
    .input(StatusGetInput)
    .output(Status)
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx.query.statuses.findFirst({
          where: and(
            eq(statuses.id, id),
            eq(statuses.organizationId, activeOrganizationId)
          ),
        })
      );
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }
      return result;
    }),
  create: protectedProcedure
    .input(StatusCreateInput)
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
  update: protectedProcedure
    .input(StatusUpdateInput)
    .output(Status)
    .mutation(async ({ ctx, input }) => {
      const { id, values } = input;
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx
          .update(statuses)
          .set({ ...values, organizationId: activeOrganizationId })
          .where(eq(statuses.id, id))
          .returning()
      );
      if (!result || result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }
      return result[0]!;
    }),
  delete: protectedProcedure
    .input(StatusGetInput)
    .output(StatusDeleteOutput)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx
          .delete(statuses)
          .where(
            and(
              eq(statuses.id, id),
              eq(statuses.organizationId, activeOrganizationId)
            )
          )
          .returning()
      );
      if (!result || result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Status not found" });
      }
      return { success: true };
    }),
});
