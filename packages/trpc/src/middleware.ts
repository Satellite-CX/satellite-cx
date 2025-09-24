import { TRPCError } from "@trpc/server";
import { t } from "./root";
import { auth } from "@repo/auth";

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

  return next({ ctx: { ...ctx, session } });
});
