import { auth } from "@repo/auth";
import { TRPCError } from "@trpc/server";
import { t } from "./root";

export const protectedMiddleware = t.middleware(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: ctx.headers,
  });
  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  const activeOrganizationId = session.session.activeOrganizationId;
  if (!activeOrganizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Active organization is required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
      activeOrganizationId,
    },
  });
});
