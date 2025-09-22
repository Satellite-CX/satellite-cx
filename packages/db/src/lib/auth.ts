import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { adminDB } from "../client";
import { plugins } from "./auth-plugins";

export const auth = betterAuth({
  database: drizzleAdapter(adminDB, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins,
});
