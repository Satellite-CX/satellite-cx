import { priorities } from "@repo/db/schema";
import {
  PriorityListTrpcInput,
  Priority,
  PriorityCreateInput,
  PriorityUpdateInput,
  PriorityGetInput,
  PriorityDeleteOutput,
} from "@repo/validators";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const prioritiesRouter = router({
  get: protectedProcedure
    .input(PriorityGetInput)
    .output(Priority)
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx.query.priorities.findFirst({
          where: and(
            eq(priorities.id, id),
            eq(priorities.organizationId, activeOrganizationId)
          ),
        })
      );
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Priority not found" });
      }
      return result;
    }),
  create: protectedProcedure
    .input(PriorityCreateInput)
    .output(Priority)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx
          .insert(priorities)
          .values({ ...input, organizationId: activeOrganizationId })
          .returning()
      );

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create priority",
        });
      }

      return result[0]!;
    }),
  list: protectedProcedure
    .input(PriorityListTrpcInput)
    .output(Priority.array())
    .query(async ({ ctx, input }) => {
      const { limit, offset } = input ?? {};
      const { activeOrganizationId } = ctx.session;
      return await ctx.db.rls((tx) =>
        tx.query.priorities.findMany({
          where: eq(priorities.organizationId, activeOrganizationId),
          limit,
          offset,
          orderBy: (prioritiesTable, { asc }) => [asc(prioritiesTable.name)],
        })
      );
    }),
  update: protectedProcedure
    .input(PriorityUpdateInput)
    .output(Priority)
    .mutation(async ({ ctx, input }) => {
      const { id, values } = input;
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx
          .update(priorities)
          .set({ ...values, organizationId: activeOrganizationId })
          .where(eq(priorities.id, id))
          .returning()
      );
      if (!result || result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Priority not found" });
      }
      return result[0]!;
    }),
  delete: protectedProcedure
    .input(PriorityGetInput)
    .output(PriorityDeleteOutput)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx
          .delete(priorities)
          .where(
            and(
              eq(priorities.id, id),
              eq(priorities.organizationId, activeOrganizationId)
            )
          )
          .returning()
      );
      if (!result || result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Priority not found" });
      }
      return { success: true };
    }),
});