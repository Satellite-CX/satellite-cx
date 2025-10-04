import { Session } from "@repo/db/auth";
import { TRPCError } from "@trpc/server";
import { members } from "@repo/db/schema";
import { adminDB } from "@repo/db/client";
import { and, eq } from "drizzle-orm";
import { AuthResult } from "./auth";

export async function authenticateWithSession(
  session: Session
): Promise<AuthResult> {
  const member = await adminDB.query.members.findFirst({
    where: and(
      eq(members.organizationId, session.session.activeOrganizationId!),
      eq(members.userId, session.user.id)
    ),
  });

  if (!member) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return {
    organizationId: session.session.activeOrganizationId!,
    member,
  };
}
