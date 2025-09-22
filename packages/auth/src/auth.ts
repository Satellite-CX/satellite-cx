import { adminDB } from "@repo/db/client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey } from "./plugins/api-key";
import { organization } from "./plugins/organization";

export const auth = betterAuth({
  database: drizzleAdapter(adminDB, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [apiKey, organization],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
