import { auth } from "@repo/auth";
import { createDrizzleClient } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { t } from "./root";
import { authenticateWithApiKey, authenticateWithSession } from "./utils";

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

  const headersApiKey = ctx.headers.get("x-api-key");

  const { organizationId, member } = headersApiKey
    ? await authenticateWithApiKey(headersApiKey)
    : await authenticateWithSession(session);

  const db = await createDrizzleClient({
    organizationId,
    role: member.role,
    userId: session.user.id,
  });

  return next({
    ctx: {
      ...ctx,
      session: {
        ...session,
        member,
        activeOrganizationId: organizationId,
      },
      db,
    },
  });
});
