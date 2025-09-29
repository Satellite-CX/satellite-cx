import { adminDB } from "@repo/db/client";
import { members } from "@repo/db/schema";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { apiKey } from "./plugins/api-key";
import { organization } from "./plugins/organization";

const options = {
  database: drizzleAdapter(adminDB, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [apiKey, organization],
  advanced: {
    cookiePrefix: "scx",
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }, ctx) => {
      const member = await adminDB.query.members.findFirst({
        where: and(
          eq(members.organizationId, session.activeOrganizationId!),
          eq(members.userId, user.id)
        ),
      });
      return {
        user,
        session,
        member,
      };
    }, options),
  ],
});

export type Session = typeof auth.$Infer.Session;
