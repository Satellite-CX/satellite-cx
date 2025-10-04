import { auth } from "@repo/db/auth";
import { TRPCError } from "@trpc/server";
import { members } from "@repo/db/schema";
import { adminDB } from "@repo/db/client";
import { and, eq } from "drizzle-orm";

export interface AuthResult {
  organizationId: string;
  member: typeof members.$inferSelect;
}

export async function authenticateWithApiKey(key: string): Promise<AuthResult> {
  const data = await auth.api.verifyApiKey({
    body: {
      key,
    },
  });

  if (!data.valid) {
    throw new TRPCError({
      ...data.error,
      code: "UNAUTHORIZED",
    });
  }

  const organizationId = data.key?.metadata?.organizationId;

  if (!organizationId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "API Key is not associated with an organization",
    });
  }

  const member = await adminDB.query.members.findFirst({
    where: and(
      eq(members.organizationId, organizationId),
      eq(members.userId, data.key!.userId)
    ),
  });

  if (!member) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return {
    organizationId,
    member,
  };
}
