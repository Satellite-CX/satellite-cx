import { customers } from "@repo/db/schema";
import {
  Customer,
  CustomerCreateInput,
  CustomerGetInput,
  CustomerListTrpcInput,
  CustomerUpdateInput,
  CustomerUpdateParams,
} from "@repo/validators";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const customersRouter = router({
  create: protectedProcedure
    .input(CustomerCreateInput)
    .output(Customer)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganizationId } = ctx.session;
      const result = await ctx.db.rls((tx) =>
        tx
          .insert(customers)
          .values({ ...input, organizationId: activeOrganizationId })
          .returning()
      );

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer",
        });
      }

      return result[0]!;
    }),
  get: protectedProcedure
    .input(CustomerGetInput)
    .output(Customer)
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const customer = await ctx.db.rls((tx) =>
        tx.query.customers.findFirst({
          where: and(
            eq(customers.id, id),
            eq(customers.organizationId, ctx.session.activeOrganizationId)
          ),
        })
      );
      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }
      return customer;
    }),
  list: protectedProcedure
    .input(CustomerListTrpcInput)
    .output(Customer.array())
    .query(async ({ ctx, input }) => {
      const { limit, offset, orderBy } = input ?? {};
      return await ctx.db.rls((tx) =>
        tx.query.customers.findMany({
          where: eq(customers.organizationId, ctx.session.activeOrganizationId),
          limit,
          offset,
          orderBy: (customersTable, { asc, desc }) => {
            if (!orderBy) {
              return [desc(customersTable.createdAt)];
            }
            const { field, direction } = orderBy;
            const orderFn = direction === "asc" ? asc : desc;
            return [orderFn(customersTable[field])];
          },
        })
      );
    }),
  update: protectedProcedure
    .input(CustomerUpdateInput.merge(CustomerUpdateParams))
    .output(Customer)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const customer = await ctx.db.rls((tx) =>
        tx.query.customers.findFirst({
          where: and(
            eq(customers.id, id),
            eq(customers.organizationId, ctx.session.activeOrganizationId)
          ),
        })
      );

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      const result = await ctx.db.rls((tx) =>
        tx
          .update(customers)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(customers.id, id))
          .returning()
      );

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update customer",
        });
      }

      return result[0]!;
    }),
  delete: protectedProcedure
    .input(CustomerGetInput)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const customer = await ctx.db.rls((tx) =>
        tx.query.customers.findFirst({
          where: and(
            eq(customers.id, id),
            eq(customers.organizationId, ctx.session.activeOrganizationId)
          ),
        })
      );

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      // Delete the customer
      await ctx.db.rls((tx) =>
        tx.delete(customers).where(eq(customers.id, id))
      );

      return {
        success: true,
        message: "Customer deleted successfully",
      };
    }),
});
